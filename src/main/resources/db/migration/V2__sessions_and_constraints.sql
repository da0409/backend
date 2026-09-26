CREATE TABLE t_auth_session (
    id CHAR(64) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    expires_at DATETIME NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE
);
ALTER TABLE t_media ADD COLUMN filename VARCHAR(128), ADD COLUMN mime VARCHAR(80);
ALTER TABLE t_assignment ADD COLUMN lng DECIMAL(10,6), ADD COLUMN lat DECIMAL(10,6);
ALTER TABLE t_assignment ADD CONSTRAINT uq_assignment UNIQUE (capsule_id, assignee_id);
ALTER TABLE t_reply ADD CONSTRAINT uq_reply_assignment UNIQUE (assignment_id);
ALTER TABLE t_capsule ADD CONSTRAINT ck_capsule_dates CHECK (answer_begin_time <= answer_end_time);
ALTER TABLE t_capsule ADD CONSTRAINT fk_capsule_user FOREIGN KEY (creator_id) REFERENCES t_user(id);
ALTER TABLE t_capsule ADD CONSTRAINT fk_capsule_poi FOREIGN KEY (poi_id) REFERENCES t_poi(id);
ALTER TABLE t_assignment ADD CONSTRAINT fk_assignment_capsule FOREIGN KEY (capsule_id) REFERENCES t_capsule(id) ON DELETE CASCADE;
ALTER TABLE t_assignment ADD CONSTRAINT fk_assignment_user FOREIGN KEY (assignee_id) REFERENCES t_user(id);
ALTER TABLE t_reply ADD CONSTRAINT fk_reply_assignment FOREIGN KEY (assignment_id) REFERENCES t_assignment(id) ON DELETE CASCADE;
ALTER TABLE t_reply ADD CONSTRAINT fk_reply_capsule FOREIGN KEY (capsule_id) REFERENCES t_capsule(id) ON DELETE CASCADE;
ALTER TABLE t_reply ADD CONSTRAINT fk_reply_user FOREIGN KEY (traveler_id) REFERENCES t_user(id);
ALTER TABLE t_capsule_media ADD CONSTRAINT fk_cm_capsule FOREIGN KEY (capsule_id) REFERENCES t_capsule(id) ON DELETE CASCADE;
ALTER TABLE t_capsule_media ADD CONSTRAINT fk_cm_media FOREIGN KEY (media_id) REFERENCES t_media(id);
ALTER TABLE t_reply_media ADD CONSTRAINT fk_rm_reply FOREIGN KEY (reply_id) REFERENCES t_reply(id) ON DELETE CASCADE;
ALTER TABLE t_reply_media ADD CONSTRAINT fk_rm_media FOREIGN KEY (media_id) REFERENCES t_media(id);
ALTER TABLE t_media ADD CONSTRAINT fk_media_user FOREIGN KEY (uploader_id) REFERENCES t_user(id);
