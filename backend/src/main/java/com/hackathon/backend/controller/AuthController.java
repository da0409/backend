package com.hackathon.backend.controller;
import com.hackathon.backend.service.AuthService;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.pojo.entity.User;
import com.hackathon.backend.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/v1/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service) {this.service=service;}
    @PostMapping("/register") @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<?> register(@Valid @RequestBody Requests.Register body) {return ApiResponse.ok(service.register(body));}
    @PostMapping("/login")
    public ApiResponse<?> login(@Valid @RequestBody Requests.Login body) {return ApiResponse.ok(service.login(body));}
    @GetMapping("/me")
    public ApiResponse<?> me(@RequestAttribute("currentUser") User user) {return ApiResponse.ok(service.view(user));}
    @PostMapping("/logout")
    public ApiResponse<?> logout(@RequestHeader("Authorization") String header) {service.logout(header);return ApiResponse.ok(null);}
}
