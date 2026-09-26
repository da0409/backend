package com.hackathon.backend.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 回信任务（领取关系）实体，对应数据库表 t_assignment
 * <p>
 * 说明：旅行者领取某时间胶囊形成的任务，id 形如 asg_20260924001 / task_20260924001。
 * 同一胶囊可被多个不同用户领取，互不排斥（讨论稿 B-05）。
 * status 含 CANCELLED 取消态与 cancelTime 取消时间（讨论稿 B-05/C-05，待确认）。
 * title / poiName / thumbUrl / question / answerEndTime 等展示字段由关联胶囊派生，不落库。
 */
@Data
public class Assignment {

    /** 主键，任务ID，形如 asg_20260924001（DB字段：id） */
    private String id;

    /** 关联时间胶囊ID（DB字段：capsule_id） */
    private String capsuleId;

    /** 领取人（旅行者）ID（DB字段：assignee_id） */
    private String assigneeId;

    /** 任务状态：ACCEPTED 已领取 / CHECKED_IN 已到现场 / COMPLETED 已回信 /
     *  EXPIRED 已过期 / CANCELLED 已取消（取消态见讨论稿 B-05）（DB字段：status） */
    private String status;

    /** 领取时间（DB字段：accept_time） */
    private LocalDateTime acceptTime;

    /** 现场确认时间（DB字段：checkin_time） */
    private LocalDateTime checkinTime;

    /** 回信提交时间（DB字段：reply_time） */
    private LocalDateTime replyTime;

    /** 取消时间（讨论稿 B-05，DB字段：cancel_time） */
    private LocalDateTime cancelTime;

    /** 关联回信ID，未提交回信时为 null（DB字段：reply_id） */
    private String replyId;

    /** 创建时间（DB字段：create_time） */
    private LocalDateTime createTime;
}