package com.hackathon.backend.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 回信素材关联实体，对应数据库表 t_reply_media
 * <p>
 * 说明：回信与其素材（照片/视频/声音）为一对多关系；
 * 读取时通过 mediaId 保证稳定ID（讨论稿 D-04）。
 */
@Data
public class ReplyMedia {

    /** 自增主键（DB字段：id） */
    @com.baomidou.mybatisplus.annotation.TableId(type = com.baomidou.mybatisplus.annotation.IdType.AUTO)
    private Long id;

    /** 关联回信ID（DB字段：reply_id） */
    private String replyId;

    /** 关联素材ID（mediaId）（DB字段：media_id） */
    private String mediaId;

    /** 素材访问URL，冗余展示用（DB字段：url） */
    private String url;

    /** 素材类型：IMAGE / VIDEO / AUDIO（DB字段：type） */
    private String type;

    /** 素材说明文字（DB字段：caption） */
    private String caption;

    /** 创建时间（DB字段：create_time） */
    private LocalDateTime createTime;
}