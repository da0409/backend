package com.hackathon.backend.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hackathon.backend.pojo.entity.Assignment;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Param;
public interface AssignmentMapper extends BaseMapper<Assignment> {
    @Select("SELECT * FROM t_assignment WHERE id = #{id} FOR UPDATE")
    Assignment lock(@Param("id") String id);
}
