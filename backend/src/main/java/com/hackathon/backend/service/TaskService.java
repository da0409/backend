package com.hackathon.backend.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.hackathon.backend.mapper.*;
import com.hackathon.backend.pojo.entity.*;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.geo.GeoDistance;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.ChronoUnit;
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
        Poi dest=pois.selectById(poiId);require(dest!=null,404,"目的地不存在");
        String city=dest.getCityCode();
        record Candidate(Capsule capsule,long count) {}
        List<Candidate> choices=new ArrayList<>();
        var q=new QueryWrapper<Capsule>().ne("creator_id",user).le("answer_begin_time",end).ge("answer_end_time",begin).ge("answer_end_time",today());
        if(city!=null&&!city.isBlank())q.eq("city_code",city);
        for(Capsule c:capsules.selectList(q)) choices.add(new Candidate(c,capsuleService.replyCount(c.getId())));
        choices.sort(Comparator.comparingLong((Candidate x)->x.capsule().getPoiId().equals(poiId)?0L:1L)
            .thenComparingLong(x->-overlapDays(x.capsule(),begin,end))
            .thenComparingLong(Candidate::count).thenComparing(x->x.capsule().getId()));
        return page(choices.stream().map(x->{
            Capsule c=x.capsule();var refs=media.capsuleRefs(c.getId());
            return map("taskId",c.getId(),"capsuleId",c.getId(),"title",c.getTitle(),"question",c.getQuestion(),"poiName",c.getPoiName(),
                "distanceMeters",0,"distanceBasis","CITY_AND_DATES",
                "thumbUrl",refs.isEmpty()?null:refs.getFirst().get("url"),"replyCount",x.count(),"estimatedMinutes",15,"answerEndTime",c.getAnswerEndTime());
        }).toList(),page,size);
    }
    private long overlapDays(Capsule c,LocalDate begin,LocalDate end) {
        LocalDate from=c.getAnswerBeginTime().isAfter(begin)?c.getAnswerBeginTime():begin;
        LocalDate to=c.getAnswerEndTime().isBefore(end)?c.getAnswerEndTime():end;
        return Math.max(0,ChronoUnit.DAYS.between(from,to)+1);
    }
    private String status(Assignment a,Capsule c) { return !a.getStatus().equals("COMPLETED")&&c.getAnswerEndTime().isBefore(today())?"EXPIRED":a.getStatus(); }
    public Map<String,Object> view(Assignment a,Capsule c) {
        return map("taskId",c.getId(),"assignmentId",a.getId(),"capsuleId",c.getId(),"title",c.getTitle(),"poiName",c.getPoiName(),
            "status",status(a,c),"acceptTime",time(a.getAcceptTime()),"checkinTime",time(a.getCheckinTime()),"replyTime",time(a.getReplyTime()),"answerEndTime",c.getAnswerEndTime());
    }
    public Map<String,Object> list(String user,String status,int page,int size) {
        require(status==null||Set.of("ACCEPTED","CHECKED_IN","COMPLETED","EXPIRED","CANCELLED").contains(status),422,"状态无效");
        var rows=assignments.selectList(new QueryWrapper<Assignment>().eq("assignee_id",user).orderByDesc("accept_time").orderByAsc("id")).stream()
            .map(a->view(a,capsuleService.get(a.getCapsuleId(),false))).filter(v->status==null||status.equals(v.get("status"))).toList();
        return page(rows,page,size);
    }
    @Transactional
    public Map<String,Object> accept(String taskId,String user) {
        Capsule c=capsuleService.get(taskId,true);
        require(!user.equals(c.getCreatorId()),403,"不能领取自己的任务");require(!c.getAnswerEndTime().isBefore(today()),409,"任务已过期");
        var list=assignments.selectList(new QueryWrapper<Assignment>().eq("capsule_id",c.getId()).eq("assignee_id",user));
        Assignment existing=list.isEmpty()?null:list.getFirst();
        require(existing==null||existing.getStatus().equals("CANCELLED"),409,"不能重复领取");
        Assignment a=existing==null?new Assignment():existing;
        if(existing==null){a.setId(id("asg"));a.setCapsuleId(c.getId());a.setAssigneeId(user);a.setCreateTime(now());}
        a.setStatus("ACCEPTED");a.setAcceptTime(now());a.setCheckinTime(null);a.setReplyTime(null);a.setReplyId(null);a.setCancelTime(null);
        if(existing==null)assignments.insert(a);else assignments.updateById(a);
        return map("taskId",c.getId(),"assignmentId",a.getId(),"status",a.getStatus());
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
        require(Set.of("ACCEPTED","CHECKED_IN").contains(a.getStatus()),409,"当前状态不能回信");
        require(a.getReplyId()==null,409,"该任务已回信，不能重复提交");
        require(b.content()!=null&&!b.content().isBlank(),422,"回信文字必填");
        require(b.mediaList()!=null&&!b.mediaList().isEmpty(),422,"回信照片必填");
        require(Boolean.TRUE.equals(b.onSiteDeclaration()),422,"需确认现场声明为本人按要求完成");
        var refs=b.mediaList();
        MediaService.privacy(b.blurFace(),true);media.validate(refs,user.getId(),false);
        Reply r=new Reply();r.setId(id("rpl"));r.setCapsuleId(c.getId());r.setAssignmentId(a.getId());r.setTravelerId(user.getId());r.setTravelerName(user.getNickname());
        r.setContent(b.content());r.setOnSiteDeclaration(true);r.setSatisfied(false);
        r.setLng(a.getLng());r.setLat(a.getLat());r.setCreateTime(now());replies.insert(r);media.saveReplyRefs(r.getId(),refs,user.getId());
        a.setStatus("COMPLETED");a.setReplyTime(now());a.setReplyId(r.getId());assignments.updateById(a);
        c.setStatus("ANSWERED");c.setUpdateTime(now());capsules.updateById(c);
        return map("replyId",r.getId(),"taskId",c.getId(),"assignmentId",a.getId(),"status",a.getStatus());
    }
    @Transactional
    public Map<String,Object> cancel(String id,String user) {
        Assignment a=owned(id,user,true);Capsule c=capsuleService.get(a.getCapsuleId(),false);
        require(Set.of("ACCEPTED","CHECKED_IN").contains(a.getStatus()),409,"当前状态不能取消领取");
        a.setStatus("CANCELLED");a.setCancelTime(now());a.setCheckinTime(null);a.setLng(null);a.setLat(null);assignments.updateById(a);
        return map("taskId",c.getId(),"assignmentId",a.getId(),"status",a.getStatus());
    }
    public Map<String,Object> detail(String id,String user) {
        Assignment a=owned(id,user,false);Capsule c=capsuleService.get(a.getCapsuleId(),false);var v=view(a,c);var refs=media.capsuleRefs(c.getId());
        v.put("question",c.getQuestion());v.put("poiId",c.getPoiId());v.put("thumbUrl",refs.isEmpty()?null:refs.getFirst().get("url"));
        Reply r=a.getReplyId()==null?null:replies.selectById(a.getReplyId());
        v.put("reply",r==null?null:map("replyId",r.getId(),"content",r.getContent(),"mediaList",media.replyRefs(r.getId()),"createTime",time(r.getCreateTime())));
        return v;
    }
}
