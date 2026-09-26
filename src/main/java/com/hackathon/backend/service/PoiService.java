package com.hackathon.backend.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.hackathon.backend.mapper.*;
import com.hackathon.backend.pojo.entity.*;
import org.springframework.stereotype.Service;
import java.util.*;
import static com.hackathon.backend.common.Support.*;
import static com.hackathon.backend.common.BusinessException.require;
@Service
public class PoiService {
    private final PoiMapper pois;private final CapsuleMapper capsules;private final ReplyMapper replies;private final ReplyService rs;
    public PoiService(PoiMapper p,CapsuleMapper c,ReplyMapper r,ReplyService rs) {pois=p;capsules=c;replies=r;this.rs=rs;}
    private Poi get(String id) { Poi p=pois.selectById(id);require(p!=null,404,"地点不存在");return p; }
    public Map<String,Object> view(Poi p) {
        return map("poiId",p.getId(),"name",p.getName(),"address",p.getAddress(),"lng",p.getLng(),"lat",p.getLat(),
            "capsuleCount",capsules.selectCount(new QueryWrapper<Capsule>().eq("poi_id",p.getId())));
    }
    public Map<String,Object> search(String keyword,int page,int size) {
        require(keyword!=null&&!keyword.isBlank()&&keyword.length()<=100,422,"搜索词无效");
        // Literal matching avoids interpreting user % and _ as wildcard operators.
        var rows=pois.selectList(new QueryWrapper<Poi>().orderByAsc("id")).stream().filter(p->p.getName().contains(keyword))
            .map(this::view).filter(p->((Number)p.get("capsuleCount")).longValue()>0).toList();
        return page(rows,page,size);
    }
    public Map<String,Object> detail(String id) {
        var v=view(get(id));long count=0;
        for(Capsule c:capsules.selectList(new QueryWrapper<Capsule>().eq("poi_id",id)))count+=replies.selectCount(new QueryWrapper<Reply>().eq("capsule_id",c.getId()));
        v.put("replyCount",count);v.put("changeSummary",null);return v;
    }
    public Map<String,Object> timeline(String id) {
        Poi p=get(id);List<Map<String,Object>> rows=new ArrayList<>();
        for(Capsule c:capsules.selectList(new QueryWrapper<Capsule>().eq("poi_id",id))) {
            var rr=replies.selectList(new QueryWrapper<Reply>().eq("capsule_id",c.getId()).orderByAsc("create_time","id"));
            if(!rr.isEmpty())rows.add(map("capsuleId",c.getId(),"title",c.getTitle(),"question",c.getQuestion(),"time",rr.getFirst().getCreateTime().toLocalDate(),
                "replyCount",rr.size(),"replies",rr.stream().map(rs::view).toList(),"_sort",rr.getFirst().getCreateTime()));
        }
        rows.sort(Comparator.comparing((Map<String,Object> r)->r.get("_sort").toString()).thenComparing(r->r.get("capsuleId").toString()));
        rows.forEach(r->r.remove("_sort"));
        return map("poiId",p.getId(),"poiName",p.getName(),"total",rows.size(),"timeline",rows,"changeSummary",null);
    }
}
