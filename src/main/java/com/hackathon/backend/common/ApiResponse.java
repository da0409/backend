package com.hackathon.backend.common;
public record ApiResponse<T>(int code, String msg, T data) {
    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(1, "success", data); }
}
