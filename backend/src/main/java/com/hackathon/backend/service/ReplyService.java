package com.hackathon.backend.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.hackathon.backend.mapper.*;
import com.hackathon.backend.pojo.entity.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static com.hackathon.backend.common.Support.*;
import static com.hackathon.backend.common.BusinessException.require;
@Service
public class ReplyService {
    private final ReplyMapper replies;private final CapsuleMapper capsules;private final AssignmentMapper assignments;private final CapsuleService cs;private final MediaService media;
    public ReplyService(ReplyMapper r,CapsuleMapper c,AssignmentMapper a,CapsuleService cs,MediaService m) {replies=r;capsules=c;assignments=a;this.cs=cs;media=m;}
    public Map<String,Object> view(Reply r) {
        return map("replyId",r.getId(),"capsuleId",r.getCapsuleId(),"assignmentId",r.getAssignmentId(),"travelerId",r.getTravelerId(),
            "travelerName",r.getTravelerName(),"content",r.getContent(),"mediaList",media.replyRefs(r.getId()),"createTime",time(r.getCreateTime()),
            "lng",r.getLng(),"lat",r.getLat(),"onSiteDeclaration",r.getOnSiteDeclaration(),"privacyProcessed",false);
    }
    public Map<String,Object> detail(String id) { Reply r=replies.selectById(id);require(r!=null,404,"回信不存在");return view(r); }
    public Map<String,Object> list(String capsuleId,int page,int size) {
        cs.get(capsuleId,false);return page(replies.selectList(new QueryWrapper<Reply>().eq("capsule_id",capsuleId).orderByDesc("create_time").orderByAsc("id")).stream().map(this::view).toList(),page,size);
    }
    @Transactional
    public void delete(String id,String user) {
        Reply r=replies.selectById(id);require(r!=null,404,"回信不存在");Capsule c=cs.get(r.getCapsuleId(),true);
        require(user.equals(r.getTravelerId())||user.equals(c.getCreatorId()),403,"无权删除回信");
        replies.deleteById(id);
        assignments.update(null,new UpdateWrapper<Assignment>().eq("id",r.getAssignmentId()).set("reply_id",null));
        c.setStatus(cs.status(c));c.setUpdateTime(now());capsules.updateById(c);
    }
}
