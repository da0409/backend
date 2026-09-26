package com.hackathon.backend.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hackathon.backend.pojo.entity.Capsule;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Param;
public interface CapsuleMapper extends BaseMapper<Capsule> {
    @Select("SELECT * FROM t_capsule WHERE id = #{id} FOR UPDATE")
    Capsule lock(@Param("id") String id);
}
