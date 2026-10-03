-- ============================================================
-- 数据库名：time_capsule（时间胶囊）
-- 字符集：utf8mb4（支持中文与 emoji）
-- 引擎：InnoDB
-- 说明：本脚本依据后端 POJO 实体类（com.hackathon.backend.pojo.entity）
--       中的数据库表字段设计。派生字段（如 mediaCount、replyCount、
--       capsuleCount）不建表列，由查询聚合得出。
-- ============================================================

CREATE DATABASE IF NOT EXISTS `time_capsule`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `time_capsule`;

-- ------------------------------------------------------------
-- 1. 用户表 t_user
-- 实体：User
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user` (
    `id`          VARCHAR(32)  NOT NULL COMMENT '用户ID，形如 u_1001',
    `username`    VARCHAR(64)  NOT NULL COMMENT '登录名',
    `nickname`    VARCHAR(64)  NOT NULL COMMENT '昵称，如“小鹿”',
    `password`    VARCHAR(128) NOT NULL COMMENT '密码（密文存储）',
    `avatar`      VARCHAR(255)          COMMENT '头像URL',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ------------------------------------------------------------
-- 2. 地点（POI）表 t_poi
-- 实体：Poi
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_poi`;
CREATE TABLE `t_poi` (
    `id`             VARCHAR(32)   NOT NULL COMMENT 'POI标识，形如 poi_1001',
    `name`           VARCHAR(128)  NOT NULL COMMENT '地点名称',
    `address`        VARCHAR(255)           COMMENT '地点地址',
    `lng`            DECIMAL(10,6)          COMMENT '经度',
    `lat`            DECIMAL(10,6)          COMMENT '纬度',
    `city_code`      VARCHAR(16)            COMMENT '城市编码（讨论稿 D-03）',
    `city_name`      VARCHAR(64)            COMMENT '城市名称（讨论稿 D-03）',
    `change_summary` TEXT                   COMMENT 'AI 生成的地点变化摘要，无回信时为 null',
    `create_time`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_city_code` (`city_code`),
    KEY `idx_poi_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='地图地点表';

-- ------------------------------------------------------------
-- 3. 素材表 t_media
-- 实体：Media
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_media`;
CREATE TABLE `t_media` (
    `id`          VARCHAR(32)  NOT NULL COMMENT '素材ID（mediaId），形如 m_20260924001',
    `url`         VARCHAR(255) NOT NULL COMMENT '素材访问URL',
    `type`        VARCHAR(16)  NOT NULL COMMENT '素材类型：IMAGE / VIDEO / AUDIO',
    `width`       INT                   COMMENT '图片宽度，视频为 0',
    `height`      INT                   COMMENT '图片高度，视频为 0',
    `duration`    INT                   COMMENT '视频时长（秒），图片为 0',
    `size`        BIGINT                COMMENT '文件大小（字节）',
    `uploader_id` VARCHAR(32)           COMMENT '上传者ID',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    PRIMARY KEY (`id`),
    KEY `idx_media_uploader` (`uploader_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='素材元信息表';

-- ------------------------------------------------------------
-- 4. 时间胶囊表 t_capsule
-- 实体：Capsule
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_capsule`;
CREATE TABLE `t_capsule` (
    `id`                VARCHAR(32)  NOT NULL COMMENT '时间胶囊ID，形如 cap_20260924001',
    `title`             VARCHAR(128) NOT NULL COMMENT '胶囊标题',
    `question`          VARCHAR(512) NOT NULL COMMENT '想问未来旅行者的问题',
    `poi_id`            VARCHAR(32)  NOT NULL COMMENT '绑定POI标识',
    `poi_name`          VARCHAR(128)          COMMENT 'POI名称，用于展示',
    `lng`               DECIMAL(10,6)         COMMENT 'POI经度，地理围栏匹配用',
    `lat`               DECIMAL(10,6)         COMMENT 'POI纬度，地理围栏匹配用',
    `city_code`         VARCHAR(16)           COMMENT '城市编码（讨论稿 B-02/D-03）',
    `city_name`         VARCHAR(64)           COMMENT '城市名称（讨论稿 B-02/D-03）',
    `answer_begin_time` DATE         NOT NULL COMMENT '期望回答开始日期',
    `answer_end_time`   DATE         NOT NULL COMMENT '期望回答截止日期',
    `blur_face`         TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否人脸模糊，默认 true',
    `status`            VARCHAR(16)  NOT NULL DEFAULT 'WAITING' COMMENT '状态：WAITING / ANSWERED / EXPIRED',
    `creator_id`        VARCHAR(32)  NOT NULL COMMENT '创建人ID',
    `create_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_capsule_creator` (`creator_id`),
    KEY `idx_capsule_poi` (`poi_id`),
    KEY `idx_capsule_city` (`city_code`),
    KEY `idx_capsule_status` (`status`),
    KEY `idx_capsule_answer_time` (`answer_end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='时间胶囊表';
-- ------------------------------------------------------------
-- 5. 时间胶囊素材关联表 t_capsule_media
-- 实体：CapsuleMedia
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_capsule_media`;
CREATE TABLE `t_capsule_media` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `capsule_id`  VARCHAR(32)  NOT NULL COMMENT '关联时间胶囊ID',
    `media_id`    VARCHAR(32)  NOT NULL COMMENT '关联素材ID（mediaId）',
    `url`         VARCHAR(255)          COMMENT '素材访问URL，冗余展示用',
    `type`        VARCHAR(16)  NOT NULL COMMENT '素材类型：IMAGE / VIDEO',
    `caption`     VARCHAR(255)          COMMENT '素材说明文字',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_cm_capsule` (`capsule_id`),
    KEY `idx_cm_media` (`media_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='时间胶囊素材关联表';

-- ------------------------------------------------------------
-- 6. 回信表 t_reply
-- 实体：Reply
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_reply`;
CREATE TABLE `t_reply` (
    `id`                  VARCHAR(32)  NOT NULL COMMENT '回信ID，形如 rpl_20261002001',
    `capsule_id`          VARCHAR(32)  NOT NULL COMMENT '关联时间胶囊ID',
    `assignment_id`       VARCHAR(32)           COMMENT '关联任务ID',
    `traveler_id`         VARCHAR(32)  NOT NULL COMMENT '回信旅行者ID',
    `traveler_name`       VARCHAR(64)           COMMENT '回信旅行者昵称',
    `content`             TEXT                  COMMENT '文字回信内容',
    `on_site_declaration` TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '现场拍摄声明（讨论稿 B-03/C-02）',
    `satisfied`           TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否被发起者标记为满意（讨论稿 B-04/C-06）',
    `satisfied_time`      DATETIME              COMMENT '满意标记时间（讨论稿 B-04）',
    `lng`                 DECIMAL(10,6)         COMMENT '回信时定位经度',
    `lat`                 DECIMAL(10,6)         COMMENT '回信时定位纬度',
    `create_time`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '回信时间',
    PRIMARY KEY (`id`),
    KEY `idx_reply_capsule` (`capsule_id`),
    KEY `idx_reply_assignment` (`assignment_id`),
    KEY `idx_reply_traveler` (`traveler_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回信表';

-- ------------------------------------------------------------
-- 7. 回信素材关联表 t_reply_media
-- 实体：ReplyMedia
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_reply_media`;
CREATE TABLE `t_reply_media` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `reply_id`    VARCHAR(32)  NOT NULL COMMENT '关联回信ID',
    `media_id`    VARCHAR(32)  NOT NULL COMMENT '关联素材ID（mediaId）',
    `url`         VARCHAR(255)          COMMENT '素材访问URL，冗余展示用',
    `type`        VARCHAR(16)  NOT NULL COMMENT '素材类型：IMAGE / VIDEO / AUDIO',
    `caption`     VARCHAR(255)          COMMENT '素材说明文字',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_rm_reply` (`reply_id`),
    KEY `idx_rm_media` (`media_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回信素材关联表';

-- ------------------------------------------------------------
-- 8. 回信任务（领取关系）表 t_assignment
-- 实体：Assignment
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `t_assignment`;
CREATE TABLE `t_assignment` (
    `id`           VARCHAR(32)  NOT NULL COMMENT '任务ID，形如 asg_20260924001',
    `capsule_id`   VARCHAR(32)  NOT NULL COMMENT '关联时间胶囊ID',
    `assignee_id`  VARCHAR(32)  NOT NULL COMMENT '领取人（旅行者）ID',
    `status`       VARCHAR(16)  NOT NULL DEFAULT 'ACCEPTED' COMMENT '状态：ACCEPTED / CHECKED_IN / COMPLETED / EXPIRED / CANCELLED（取消态见讨论稿 B-05）',
    `accept_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
    `checkin_time` DATETIME              COMMENT '现场确认时间',
    `reply_time`   DATETIME              COMMENT '回信提交时间',
    `cancel_time`  DATETIME              COMMENT '取消时间（讨论稿 B-05）',
    `reply_id`     VARCHAR(32)           COMMENT '关联回信ID，未提交回信时为 null',
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_asg_assignee` (`assignee_id`),
    KEY `idx_asg_capsule` (`capsule_id`),
    KEY `idx_asg_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回信任务表';