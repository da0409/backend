package com.hackathon.backend.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 素材元信息实体，对应数据库表 t_media
 * <p>
 * 说明：素材全局复用，被时间胶囊与回信通过 mediaId 引用；
 * 上传接口返回 mediaId、url、type、width、height、duration。
 */
@Data
public class Media {
    private String filename;
    private String mime;

    /** 主键，素材ID（mediaId），形如 m_20260924001（DB字段：id） */
    private String id;

    /** 素材访问URL（DB字段：url） */
    private String url;

    /** 素材类型：IMAGE / VIDEO / AUDIO（DB字段：type） */
    private String type;

    /** 图片宽度，视频为 0（DB字段：width） */
    private Integer width;

    /** 图片高度，视频为 0（DB字段：height） */
    private Integer height;

    /** 视频时长（秒），图片为 0（DB字段：duration） */
    private Integer duration;

    /** 文件大小（字节）（DB字段：size） */
    private Long size;

    /** 上传者ID（DB字段：uploader_id） */
    private String uploaderId;

    /** 上传创建时间（DB字段：create_time） */
    private LocalDateTime createTime;
}