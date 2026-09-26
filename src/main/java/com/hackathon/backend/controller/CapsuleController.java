package com.hackathon.backend.controller;
import com.hackathon.backend.service.CapsuleService;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.pojo.entity.User;
import com.hackathon.backend.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
@RestController
@RequestMapping("/v1/capsules")
public class CapsuleController {
    private final CapsuleService service;
    public CapsuleController(CapsuleService service) {this.service=service;}
    @PostMapping @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<?> create(@Valid @RequestBody Requests.CapsuleCreate body,@RequestAttribute("currentUser") User user) {return ApiResponse.ok(service.create(body,user.getId()));}
    @GetMapping
    public ApiResponse<?> list(@RequestAttribute("currentUser") User user,
        @RequestParam(required=false) String creatorId,@RequestParam(required=false) String poiId,@RequestParam(required=false) String status,
        @RequestParam(required=false) LocalDate begin,@RequestParam(required=false) LocalDate end,
        @RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="10") int pageSize) {
        return ApiResponse.ok(service.list(user.getId(),creatorId,poiId,status,begin,end,page,pageSize));
    }
    @GetMapping("/{id}") public ApiResponse<?> detail(@PathVariable String id) {return ApiResponse.ok(service.detail(id));}
    @PutMapping public ApiResponse<?> update(@Valid @RequestBody Requests.CapsuleUpdate body,@RequestAttribute("currentUser") User user) {service.update(body,user.getId());return ApiResponse.ok(null);}
    @DeleteMapping("/{id}") public ApiResponse<?> delete(@PathVariable String id,@RequestAttribute("currentUser") User user) {service.delete(id,user.getId());return ApiResponse.ok(null);}
}
