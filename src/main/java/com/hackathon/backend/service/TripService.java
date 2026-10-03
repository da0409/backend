package com.hackathon.backend.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.hackathon.backend.mapper.TripMapper;
import com.hackathon.backend.mapper.PoiMapper;
import com.hackathon.backend.pojo.entity.Trip;
import com.hackathon.backend.pojo.entity.Poi;
import com.hackathon.backend.pojo.dto.Requests;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import static com.hackathon.backend.common.Support.*;
import static com.hackathon.backend.common.BusinessException.require;

@Service
public class TripService {
    private final TripMapper trips;
    private final PoiMapper pois;
    private final TaskService tasks;
    public TripService(TripMapper trips,PoiMapper pois,TaskService tasks) {
        this.trips=trips;this.pois=pois;this.tasks=tasks;
    }
    private Trip owned(String id,String user) {
        Trip t=trips.selectOne(new QueryWrapper<Trip>().eq("id",id).eq("traveler_id",user));
        require(t!=null,404,"行程不存在");return t;
    }
    private void lock(String user) { require(trips.lockOwner(user)!=null,401,"用户不存在"); }
    private void validate(Requests.TripInput b) {
        require(!b.arrivalDate().isAfter(b.departureDate())&&!b.departureDate().isBefore(today()),422,"行程日期无效");
        Poi p=pois.selectById(b.destinationPoiId());
        require(p!=null&&p.getLng()!=null&&p.getLat()!=null,422,"目的地不存在或缺少坐标");
    }
    private void apply(Trip t,Requests.TripInput b) {
        t.setPoiId(b.destinationPoiId());t.setArrivalDate(b.arrivalDate());t.setDepartureDate(b.departureDate());
        t.setParticipatesInMatching(b.participatesInMatching());t.setUpdateTime(now());
        if(!b.participatesInMatching())t.setActive(false);
    }
    private Map<String,Object> view(Trip t) {
        Poi p=pois.selectById(t.getPoiId());
        return map("tripId",t.getId(),"travelerId",t.getTravelerId(),
            "destination",map("poiId",p.getId(),"poiName",p.getName(),"cityCode",p.getCityCode(),"cityName",p.getCityName(),"longitude",p.getLng(),"latitude",p.getLat()),
            "arrivalDate",t.getArrivalDate(),"departureDate",t.getDepartureDate(),
            "participatesInMatching",t.getParticipatesInMatching(),"active",t.getActive(),
            "createTime",time(t.getCreateTime()),"updateTime",time(t.getUpdateTime()));
    }
    public Map<String,Object> list(String user,int page,int size) {
        return page(trips.selectList(new QueryWrapper<Trip>().eq("traveler_id",user).orderByDesc("create_time").orderByAsc("id")).stream().map(this::view).toList(),page,size);
    }
    public Map<String,Object> detail(String id,String user) { return view(owned(id,user)); }
    @Transactional
    public Map<String,Object> create(Requests.TripInput b,String user) {
        validate(b);
        Trip t=new Trip();t.setId(id("trp"));t.setTravelerId(user);t.setActive(false);t.setCreateTime(now());apply(t,b);
        trips.insert(t);return view(t);
    }
    @Transactional
    public Map<String,Object> update(String id,Requests.TripInput b,String user) {
        lock(user);Trip t=owned(id,user);validate(b);apply(t,b);trips.updateById(t);return view(t);
    }
    @Transactional
    public void delete(String id,String user) { lock(user);owned(id,user);trips.deleteById(id); }
    public Map<String,Object> active(String user) {
        Trip t=trips.selectOne(new QueryWrapper<Trip>().eq("traveler_id",user).eq("active",true).ge("departure_date",today()));
        return t==null?null:view(t);
    }
    private void clear(String user) {
        trips.update(null,new UpdateWrapper<Trip>().eq("traveler_id",user).eq("active",true).set("active",false).set("update_time",now()));
    }
    @Transactional
    public Map<String,Object> select(String id,String user) {
        lock(user);Trip t=owned(id,user);
        require(Boolean.TRUE.equals(t.getParticipatesInMatching()),409,"该行程未授权用于匹配");
        require(!t.getDepartureDate().isBefore(today()),409,"行程已过期");
        clear(user);t.setActive(true);t.setUpdateTime(now());trips.updateById(t);return view(t);
    }
    @Transactional public void clearActive(String user) { lock(user);clear(user); }
    @Transactional
    public Map<String,Object> matches(String id,String user,int radius,int page,int size) {
        lock(user);Trip t=owned(id,user);
        require(Boolean.TRUE.equals(t.getParticipatesInMatching()),409,"该行程未授权用于匹配");
        return tasks.recommend(t.getPoiId(),t.getArrivalDate(),t.getDepartureDate(),radius,page,size,user);
    }
}
