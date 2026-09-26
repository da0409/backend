package com.hackathon.backend.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
@Configuration
public class WebConfiguration implements WebMvcConfigurer {
    private final AuthInterceptor auth;
    public WebConfiguration(AuthInterceptor auth) { this.auth=auth; }
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auth).addPathPatterns("/v1/**").excludePathPatterns("/v1/auth/register","/v1/auth/login","/v1/health");
    }
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/v1/**").allowedOrigins("http://localhost:5173","http://127.0.0.1:5173")
            .allowedMethods("GET","POST","PUT","DELETE","OPTIONS").allowedHeaders("Authorization","Content-Type");
    }
}
