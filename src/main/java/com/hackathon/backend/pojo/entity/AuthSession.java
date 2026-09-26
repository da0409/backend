package com.hackathon.backend.pojo.entity;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class AuthSession {
    private String id;
    private String userId;
    private LocalDateTime expiresAt;
}
