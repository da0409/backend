package com.hackathon.backend.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体，对应数据库表 t_user
 * <p>
 * 说明：用于平台用户（问题发起者 / 回信旅行者），id 形如 u_1001、u_2001。
 */
@Data
public class User {

    /** 主键，用户ID，形如 u_1001（DB字段：id） */
    private String id;

    /** 登录名（DB字段：username） */
    private String username;

    /** 昵称，如“小鹿”（DB字段：nickname） */
    private String nickname;

    /** 密码（密文存储）（DB字段：password） */
    private String password;

    /** 头像URL（DB字段：avatar） */
    private String avatar;

    /** 创建时间（DB字段：create_time） */
    private LocalDateTime createTime;

    /** 更新时间（DB字段：update_time） */
    private LocalDateTime updateTime;
}