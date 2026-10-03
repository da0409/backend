package com.hackathon.backend.config;
import com.hackathon.backend.service.AuthService;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
@Component
public class AuthInterceptor implements HandlerInterceptor {
    private final AuthService auth;
    public AuthInterceptor(AuthService auth) { this.auth=auth; }
    @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler) {
        if ("OPTIONS".equals(request.getMethod())) return true;
        request.setAttribute("currentUser",auth.authenticate(request.getHeader("Authorization")));
        return true;
    }
}
