package com.hackathon.backend.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.hackathon.backend.mapper.*;
import com.hackathon.backend.pojo.entity.*;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.geo.GeoDistance;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import static com.hackathon.backend.common.Support.*;
import static com.hackathon.backend.common.BusinessException.require;

@Service
public class TaskService {
    private final CapsuleMapper capsules;private final PoiMapper pois;private final AssignmentMapper assignments;
    private final ReplyMapper replies;private final CapsuleService capsuleService;private final MediaService media;
    public TaskService(CapsuleMapper c,PoiMapper p,AssignmentMapper a,ReplyMapper r,CapsuleService cs,MediaService m) {
        capsules=c;pois=p;assignments=a;replies=r;capsuleService=cs;media=m;
    }
    public Map<String,Object> recommend(String poiId,LocalDate begin,LocalDate end,int radius,int page,int size,String user) {
        require(!begin.isAfter(end)&&!end.isBefore(today()),422,"行程日期无效");require(radius>=1&&radius<=10000,422,"半径范围无效");
        Poi dest=pois.selectById(poiId);require(dest!=null&&dest.getLng()!=null&&dest.getLat()!=null,404,"目的地不存在或缺少坐标");
        Set<String> claimed=new HashSet<>();
        assignments.selectList(new QueryWrapper<Assignment>().eq("assignee_id",user)).forEach(a->claimed.add(a.getCapsuleId()));
        record Candidate(Capsule capsule,double meters,long count) {}
        List<Candidate> choices=new ArrayList<>();
        for(Capsule c:capsules.selectList(new QueryWrapper<Capsule>().ne("creator_id",user).le("answer_begin_time",end).ge("answer_end_time",begin).ge("answer_end_time",today()))) {
            if(claimed.contains(c.getId())||c.getLng()==null||c.getLat()==null)continue;
            double meters=GeoDistance.distance(dest.getLng(),dest.getLat(),c.getLng(),c.getLat());
            if(meters<=radius)choices.add(new Candidate(c,meters,capsuleService.replyCount(c.getId())));
        }
        choices.sort(Comparator.comparing((Candidate x)->!x.capsule().getPoiId().equals(poiId)).thenComparingDouble(Candidate::meters)
            .thenComparingLong(x->Math.abs(x.capsule().getAnswerBeginTime().toEpochDay()+x.capsule().getAnswerEndTime().toEpochDay()-begin.toEpochDay()-end.toEpochDay()))
            .thenComparingLong(Candidate::count).thenComparing(x->x.capsule().getId()));
        return page(choices.stream().map(x->{
            Capsule c=x.capsule();var refs=media.capsuleRefs(c.getId());
            return map("taskId",c.getId(),"capsuleId",c.getId(),"title",c.getTitle(),"question",c.getQuestion(),"poiName",c.getPoiName(),
                "distanceMeters",Math.round(x.meters()),"distanceBasis","DESTINATION_STRAIGHT_LINE",
                "thumbUrl",refs.isEmpty()?null:refs.getFirst().get("url"),"replyCount",x.count(),"estimatedMinutes",15,"answerEndTime",c.getAnswerEndTime());
        }).toList(),page,size);
    }
    private String status(Assignment a,Capsule c) { return !a.getStatus().equals("COMPLETED")&&c.getAnswerEndTime().isBefore(today())?"EXPIRED":a.getStatus(); }
    public Map<String,Object> view(Assignment a,Capsule c) {
        return map("taskId",c.getId(),"assignmentId",a.getId(),"capsuleId",c.getId(),"title",c.getTitle(),"poiName",c.getPoiName(),
            "status",status(a,c),"acceptTime",time(a.getAcceptTime()),"checkinTime",time(a.getCheckinTime()),"replyTime",time(a.getReplyTime()),"answerEndTime",c.getAnswerEndTime());
    }
    public Map<String,Object> list(String user,String status,int page,int size) {
        require(status==null||Set.of("ACCEPTED","CHECKED_IN","COMPLETED","EXPIRED").contains(status),422,"状态无效");
        var rows=assignments.selectList(new QueryWrapper<Assignment>().eq("assignee_id",user).orderByDesc("accept_time").orderByAsc("id")).stream()
            .map(a->view(a,capsuleService.get(a.getCapsuleId(),false))).filter(v->status==null||status.equals(v.get("status"))).toList();
        return page(rows,page,size);
    }
    @Transactional
    public Map<String,Object> accept(String taskId,String user) {
        Capsule c=capsuleService.get(taskId,true);
        require(!user.equals(c.getCreatorId()),403,"不能领取自己的任务");require(!c.getAnswerEndTime().isBefore(today()),409,"任务已过期");
        require(assignments.selectCount(new QueryWrapper<Assignment>().eq("capsule_id",c.getId()).eq("assignee_id",user))==0,409,"不能重复领取");
        Assignment a=new Assignment();a.setId(id("asg"));a.setCapsuleId(c.getId());a.setAssigneeId(user);a.setStatus("ACCEPTED");a.setAcceptTime(now());a.setCreateTime(now());
        assignments.insert(a);return map("taskId",c.getId(),"assignmentId",a.getId(),"status",a.getStatus());
    }
    private Assignment owned(String id,String user,boolean lock) {
        Assignment a=assignments.selectById(id);require(a!=null&&user.equals(a.getAssigneeId()),404,"领取记录不存在");
        if(lock) { capsuleService.get(a.getCapsuleId(),true);a=assignments.lock(id);require(a!=null,404,"领取记录不存在"); }
        return a;
    }
    private void window(Capsule c) { require(!today().isBefore(c.getAnswerBeginTime())&&!today().isAfter(c.getAnswerEndTime()),409,"当前不在回答时间窗内"); }
    @Transactional
    public Map<String,Object> checkin(String id,Requests.Checkin b,String user) {
        Assignment a=owned(id,user,true);Capsule c=capsuleService.get(a.getCapsuleId(),false);window(c);
        require(Set.of("ACCEPTED","CHECKED_IN").contains(a.getStatus()),409,"当前状态不能签到");
        double meters=GeoDistance.distance(c.getLng(),c.getLat(),b.lng(),b.lat());require(meters<=300,422,"超出 300 米签到范围");
        a.setStatus("CHECKED_IN");a.setCheckinTime(now());a.setLng(b.lng());a.setLat(b.lat());assignments.updateById(a);
        return map("taskId",c.getId(),"assignmentId",a.getId(),"status",a.getStatus(),"distanceToPoi",Math.round(meters),"verificationMethod","CLIENT_COORDINATES");
    }
    @Transactional
    public Map<String,Object> submit(String id,Requests.ReplyCreate b,User user) {
        Assignment a=owned(id,user.getId(),true);Capsule c=capsuleService.get(a.getCapsuleId(),false);window(c);
        require(a.getStatus().equals("CHECKED_IN"),409,"请先签到，且不能重复回信");
        require(a.getCheckinTime()!=null&&a.getCheckinTime().isAfter(now().minusMinutes(30)),409,"签到过期，请重新签到");
        var refs=b.mediaList()==null?List.<Requests.MediaRef>of():b.mediaList();
        require(b.content()!=null&&!b.content().isBlank()||!refs.isEmpty(),422,"文字或素材至少一项");
        MediaService.privacy(b.blurFace(),!refs.isEmpty());media.validate(refs,user.getId(),false);
        Reply r=new Reply();r.setId(id("rpl"));r.setCapsuleId(c.getId());r.setAssignmentId(a.getId());r.setTravelerId(user.getId());r.setTravelerName(user.getNickname());
        r.setContent(b.content()==null?"":b.content());r.setOnSiteDeclaration(Boolean.TRUE.equals(b.onSiteDeclaration()));r.setSatisfied(false);
        r.setLng(a.getLng());r.setLat(a.getLat());r.setCreateTime(now());replies.insert(r);media.saveReplyRefs(r.getId(),refs,user.getId());
        a.setStatus("COMPLETED");a.setReplyTime(now());a.setReplyId(r.getId());assignments.updateById(a);
        c.setStatus("ANSWERED");c.setUpdateTime(now());capsules.updateById(c);
        return map("replyId",r.getId(),"taskId",c.getId(),"assignmentId",a.getId(),"status",a.getStatus());
    }
    public Map<String,Object> detail(String id,String user) {
        Assignment a=owned(id,user,false);Capsule c=capsuleService.get(a.getCapsuleId(),false);var v=view(a,c);var refs=media.capsuleRefs(c.getId());
        v.put("question",c.getQuestion());v.put("poiId",c.getPoiId());v.put("thumbUrl",refs.isEmpty()?null:refs.getFirst().get("url"));
        Reply r=a.getReplyId()==null?null:replies.selectById(a.getReplyId());
        v.put("reply",r==null?null:map("replyId",r.getId(),"content",r.getContent(),"mediaList",media.replyRefs(r.getId()),"createTime",time(r.getCreateTime())));
        return v;
    }
}
