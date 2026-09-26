package com.hackathon.backend.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 时间胶囊素材关联实体，对应数据库表 t_capsule_media
 * <p>
 * 说明：时间胶囊与其历史照片/视频素材为一对多关系；
 * 读取时通过 mediaId 保证稳定ID（讨论稿 D-04）。
 */
@Data
public class CapsuleMedia {

    /** 自增主键（DB字段：id） */
    private Long id;

    /** 关联时间胶囊ID（DB字段：capsule_id） */
    private String capsuleId;

    /** 关联素材ID（mediaId）（DB字段：media_id） */
    private String mediaId;

    /** 素材访问URL，冗余展示用（DB字段：url） */
    private String url;

    /** 素材类型：IMAGE / VIDEO（DB字段：type） */
    private String type;

    /** 素材说明文字（DB字段：caption） */
    private String caption;

    /** 创建时间（DB字段：create_time） */
    private LocalDateTime createTime;
}