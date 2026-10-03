package com.hackathon.backend.common;
import lombok.Getter;
@Getter
public class BusinessException extends RuntimeException {
    private final int status;
    public BusinessException(int status, String message) { super(message); this.status = status; }
    public static void require(boolean condition, int status, String message) {
        if (!condition) throw new BusinessException(status, message);
    }
}
