package com.hackathon.backend.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.hackathon.backend.mapper.*;
import com.hackathon.backend.pojo.entity.*;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.nativegeo.NativeGeo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import static com.hackathon.backend.common.Support.*;
import static com.hackathon.backend.common.BusinessException.require;

@Service
public class CapsuleService {
    private final CapsuleMapper capsules; private final PoiMapper pois;
    private final ReplyMapper replies; private final AssignmentMapper assignments; private final MediaService media;
    public CapsuleService(CapsuleMapper c,PoiMapper p,ReplyMapper r,AssignmentMapper a,MediaService m) {capsules=c;pois=p;replies=r;assignments=a;media=m;}
    public Capsule get(String id,boolean lock) {
        Capsule c=lock?capsules.lock(id):capsules.selectById(id);require(c!=null,404,"胶囊不存在");return c;
    }
    public long replyCount(String id) { return replies.selectCount(new QueryWrapper<Reply>().eq("capsule_id",id)); }
    public String status(Capsule c) { return replyCount(c.getId())>0?"ANSWERED":c.getAnswerEndTime().isBefore(today())?"EXPIRED":"WAITING"; }
    public Map<String,Object> view(Capsule c,boolean detail) {
        var refs=media.capsuleRefs(c.getId());
        var v=map("capsuleId",c.getId(),"taskId",c.getId(),"title",c.getTitle(),"question",c.getQuestion(),
            "poiId",c.getPoiId(),"poiName",c.getPoiName(),"creatorId",c.getCreatorId(),"status",status(c),
            "cityCode",c.getCityCode(),"cityName",c.getCityName(),"answerBeginTime",c.getAnswerBeginTime(),"answerEndTime",c.getAnswerEndTime(),
            "createTime",time(c.getCreateTime()),"updateTime",time(c.getUpdateTime()),"mediaCount",refs.size(),"replyCount",replyCount(c.getId()));
        if(detail) { v.put("mediaList",refs);v.put("lng",c.getLng());v.put("lat",c.getLat());v.put("blurFace",c.getBlurFace()); }
        return v;
    }
    public Map<String,Object> detail(String id) { return view(get(id,false),true); }
    @Transactional
    public Map<String,Object> create(Requests.CapsuleCreate b,String owner) {
        require(!b.answerBeginTime().isAfter(b.answerEndTime())&&!b.answerEndTime().isBefore(today()),422,"回答日期范围无效");
        MediaService.privacy(b.blurFace(),!b.mediaList().isEmpty());media.validate(b.mediaList(),owner,true);
        Poi p=pois.selectById(b.poiId());
        if(p==null) {
            require(b.poiName()!=null&&!b.poiName().isBlank(),422,"新地点需要名称");
            p=new Poi();p.setId(b.poiId());p.setName(b.poiName());p.setLng(b.lng());p.setLat(b.lat());
            p.setCityCode(b.cityCode());p.setCityName(b.cityName());p.setCreateTime(now());p.setUpdateTime(now());pois.insert(p);
        } else {
            require(p.getLng()!=null&&p.getLat()!=null&&NativeGeo.distance(p.getLng(),p.getLat(),b.lng(),b.lat())<=20,409,"已有 POI 坐标不一致");
            require(b.poiName()==null||b.poiName().equals(p.getName()),409,"已有 POI 名称不一致");
        }
        Capsule c=new Capsule();c.setId(id("cap"));c.setTitle(b.title());c.setQuestion(b.question());c.setPoiId(p.getId());c.setPoiName(p.getName());
        c.setLng(p.getLng());c.setLat(p.getLat());c.setCityCode(p.getCityCode());c.setCityName(p.getCityName());
        c.setAnswerBeginTime(b.answerBeginTime());c.setAnswerEndTime(b.answerEndTime());c.setBlurFace(false);c.setStatus("WAITING");
        c.setCreatorId(owner);c.setCreateTime(now());c.setUpdateTime(now());capsules.insert(c);
        media.saveCapsuleRefs(c.getId(),b.mediaList(),owner);
        return map("capsuleId",c.getId(),"taskId",c.getId(),"status","WAITING");
    }
    public Map<String,Object> list(String user,String creator,String poi,String status,LocalDate begin,LocalDate end,int page,int size) {
        require(begin==null||end==null||!begin.isAfter(end),422,"日期范围无效");
        require(status==null||Set.of("WAITING","ANSWERED","EXPIRED").contains(status),422,"状态无效");
        var q=new QueryWrapper<Capsule>().eq("creator_id",creator==null?user:creator).eq(poi!=null,"poi_id",poi);
        if(begin!=null)q.ge("create_time",begin.atStartOfDay());
        if(end!=null)q.lt("create_time",end.plusDays(1).atStartOfDay());
        var rows=capsules.selectList(q.orderByDesc("create_time").orderByAsc("id")).stream()
            .filter(c->status==null||status.equals(status(c))).map(c->view(c,false)).toList();
        return page(rows,page,size);
    }
    @Transactional
    public void update(Requests.CapsuleUpdate b,String owner) {
        Capsule c=get(b.capsuleId(),true);require(owner.equals(c.getCreatorId()),403,"只有创建者可以修改");
        require(replyCount(c.getId())==0,409,"已收到回信的胶囊不能修改");
        if(Boolean.TRUE.equals(b.blurFace()))MediaService.privacy(true,true);
        if(b.poiId()!=null||b.answerBeginTime()!=null||b.answerEndTime()!=null)
            require(assignments.selectCount(new QueryWrapper<Assignment>().eq("capsule_id",c.getId()))==0,409,"已被领取后不能改变地点或日期");
        LocalDate begin=b.answerBeginTime()==null?c.getAnswerBeginTime():b.answerBeginTime();
        LocalDate end=b.answerEndTime()==null?c.getAnswerEndTime():b.answerEndTime();
        require(!begin.isAfter(end)&&!end.isBefore(today()),422,"回答日期范围无效");
        if(b.poiId()!=null) {
            Poi p=pois.selectById(b.poiId());require(p!=null&&p.getLng()!=null&&p.getLat()!=null,422,"地点不存在或缺少坐标");
            c.setPoiId(p.getId());c.setPoiName(p.getName());c.setLng(p.getLng());c.setLat(p.getLat());c.setCityCode(p.getCityCode());c.setCityName(p.getCityName());
        }
        require(b.poiName()==null||b.poiName().equals(c.getPoiName()),409,"地点名称不一致");
        if(b.title()!=null){require(!b.title().isBlank(),422,"标题不能为空");c.setTitle(b.title());}
        if(b.question()!=null){require(!b.question().isBlank(),422,"问题不能为空");c.setQuestion(b.question());}
        if(b.mediaList()!=null)media.saveCapsuleRefs(c.getId(),b.mediaList(),owner);
        c.setAnswerBeginTime(begin);c.setAnswerEndTime(end);c.setUpdateTime(now());capsules.updateById(c);
    }
    @Transactional
    public void delete(String id,String owner) { Capsule c=get(id,true);require(owner.equals(c.getCreatorId()),403,"只有创建者可以删除");capsules.deleteById(id); }
}
