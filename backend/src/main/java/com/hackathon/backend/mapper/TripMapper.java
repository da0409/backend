package com.hackathon.backend.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hackathon.backend.pojo.entity.Trip;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface TripMapper extends BaseMapper<Trip> {
    @Select("SELECT id FROM t_user WHERE id = #{user} FOR UPDATE")
    String lockOwner(@Param("user") String user);
}
