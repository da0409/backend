package com.hackathon.backend.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 回信实体，对应数据库表 t_reply
 * <p>
 * 说明：旅行者对时间胶囊问题的“远方回信”，id 形如 rpl_20261002001。
 * onSiteDeclaration 现场拍摄声明、satisfied/satisfiedTime 满意标记
 * 来源于《前后端接口对齐讨论稿》B-03 / B-04（待团队确认）。
 */
@Data
public class Reply {

    /** 主键，回信ID，形如 rpl_20261002001（DB字段：id） */
    private String id;

    /** 关联时间胶囊ID（DB字段：capsule_id） */
    private String capsuleId;

    /** 关联任务ID（DB字段：assignment_id） */
    private String assignmentId;

    /** 回信旅行者ID（DB字段：traveler_id） */
    private String travelerId;

    /** 回信旅行者昵称（DB字段：traveler_name） */
    private String travelerName;

    /** 文字回信内容（DB字段：content） */
    private String content;

    /** 现场拍摄声明，是否声明在现场拍摄（讨论稿 B-03/C-02，DB字段：on_site_declaration） */
    private Boolean onSiteDeclaration;

    /** 是否被问题发起者标记为满意（讨论稿 B-04/C-06，DB字段：satisfied） */
    private Boolean satisfied;

    /** 满意标记时间（讨论稿 B-04，DB字段：satisfied_time） */
    private LocalDateTime satisfiedTime;

    /** 回信时定位经度（DB字段：lng） */
    private Double lng;

    /** 回信时定位纬度（DB字段：lat） */
    private Double lat;

    /** 回信时间（DB字段：create_time） */
    private LocalDateTime createTime;
}