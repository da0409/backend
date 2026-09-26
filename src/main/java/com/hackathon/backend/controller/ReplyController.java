package com.hackathon.backend.controller;
import com.hackathon.backend.service.ReplyService;
import com.hackathon.backend.pojo.entity.User;
import com.hackathon.backend.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/v1/replies")
public class ReplyController {
    private final ReplyService service;
    public ReplyController(ReplyService service) {this.service=service;}
    @GetMapping public ApiResponse<?> list(@RequestParam String capsuleId,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="10") int pageSize) {return ApiResponse.ok(service.list(capsuleId,page,pageSize));}
    @GetMapping("/{id}") public ApiResponse<?> detail(@PathVariable String id) {return ApiResponse.ok(service.detail(id));}
    @DeleteMapping("/{id}") public ApiResponse<?> delete(@PathVariable String id,@RequestAttribute("currentUser") User user) {service.delete(id,user.getId());return ApiResponse.ok(null);}
}
