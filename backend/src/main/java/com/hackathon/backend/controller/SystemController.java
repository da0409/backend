package com.hackathon.backend.controller;
import com.hackathon.backend.service.HealthService;
import com.hackathon.backend.common.*;
import org.springframework.web.bind.annotation.*;
@RestController
public class SystemController {
    private final HealthService service;
    public SystemController(HealthService service){this.service=service;}
    @GetMapping("/v1/health") public ApiResponse<?> health(){return ApiResponse.ok(service.health());}
    @PostMapping({"/v1/ai/compare","/v1/ai/angle","/v1/ai/privacy/blur"})
    public ApiResponse<?> ai(){throw new BusinessException(501,"本版尚未实现 AI 处理");}
}
