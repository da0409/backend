package com.hackathon.backend.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 地图地点（POI）实体，对应数据库表 t_poi
 * <p>
 * 说明：时间胶囊绑定到具体 POI，id 形如 poi_1001。
 * cityCode / cityName 来源于《前后端接口对齐讨论稿》D-03，用于按城市匹配。
 */
@Data
public class Poi {

    /** 主键，POI标识，形如 poi_1001（DB字段：id） */
    private String id;

    /** 地点名称，如“玉龙雪山·云杉坪”（DB字段：name） */
    private String name;

    /** 地点地址（DB字段：address） */
    private String address;

    /** 经度（DB字段：lng） */
    private Double lng;

    /** 纬度（DB字段：lat） */
    private Double lat;

    /** 城市编码（讨论稿 D-03，DB字段：city_code） */
    private String cityCode;

    /** 城市名称（讨论稿 D-03，DB字段：city_name） */
    private String cityName;

    /** AI 生成的地点变化摘要，无回信时为 null（DB字段：change_summary） */
    private String changeSummary;

    /** 创建时间（DB字段：create_time） */
    private LocalDateTime createTime;

    /** 更新时间（DB字段：update_time） */
    private LocalDateTime updateTime;
}