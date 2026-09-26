package com.hackathon.backend.pojo.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 时间胶囊实体，对应数据库表 t_capsule
 * <p>
 * 说明：用户发布的地点问题，id 形如 cap_20260924001。
 * mediaCount / replyCount 为派生统计字段，不落库，由查询时聚合得出。
 * cityCode / cityName 来源于《前后端接口对齐讨论稿》B-02/D-03，用于按城市匹配。
 */
@Data
public class Capsule {

    /** 主键，时间胶囊ID，形如 cap_20260924001（DB字段：id） */
    private String id;

    /** 胶囊标题（DB字段：title） */
    private String title;

    /** 想问未来旅行者的问题（DB字段：question） */
    private String question;

    /** 绑定的地图POI标识（DB字段：poi_id） */
    private String poiId;

    /** POI名称，用于展示（DB字段：poi_name） */
    private String poiName;

    /** POI经度，地理围栏匹配用（DB字段：lng） */
    private Double lng;

    /** POI纬度，地理围栏匹配用（DB字段：lat） */
    private Double lat;

    /** 城市编码（讨论稿 B-02/D-03，DB字段：city_code） */
    private String cityCode;

    /** 城市名称（讨论稿 B-02/D-03，DB字段：city_name） */
    private String cityName;

    /** 期望回答开始日期（DB字段：answer_begin_time） */
    private LocalDate answerBeginTime;

    /** 期望回答截止日期（DB字段：answer_end_time） */
    private LocalDate answerEndTime;

    /** 是否在AI处理时对人脸进行模糊，默认 true（DB字段：blur_face） */
    private Boolean blurFace;

    /** 胶囊状态：WAITING 待回信 / ANSWERED 已收到回信 / EXPIRED 已过期（DB字段：status） */
    private String status;

    /** 创建人ID（DB字段：creator_id） */
    private String creatorId;

    /** 创建时间（DB字段：create_time） */
    private LocalDateTime createTime;

    /** 更新时间（DB字段：update_time） */
    private LocalDateTime updateTime;

    /** 素材数量，派生统计字段，不落库 */
    private Integer mediaCount;

    /** 已收到回信数量，派生统计字段，不落库 */
    private Integer replyCount;
}