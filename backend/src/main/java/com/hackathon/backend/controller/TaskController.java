package com.hackathon.backend.controller;
import com.hackathon.backend.service.TaskService;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.pojo.entity.User;
import com.hackathon.backend.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
@RestController
@RequestMapping("/v1/tasks")
public class TaskController {
    private final TaskService service;
    public TaskController(TaskService service) {this.service=service;}
    @GetMapping("/recommend")
    public ApiResponse<?> recommend(@RequestParam String destinationPoiId,@RequestParam LocalDate travelBeginDate,@RequestParam LocalDate travelEndDate,
        @RequestParam(defaultValue="3000") int radiusMeters,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="10") int pageSize,
        @RequestAttribute("currentUser") User user) {
        return ApiResponse.ok(service.recommend(destinationPoiId,travelBeginDate,travelEndDate,radiusMeters,page,pageSize,user.getId()));
    }
    @GetMapping public ApiResponse<?> list(@RequestParam(required=false) String status,@RequestParam(defaultValue="1") int page,
        @RequestParam(defaultValue="10") int pageSize,@RequestAttribute("currentUser") User user) {return ApiResponse.ok(service.list(user.getId(),status,page,pageSize));}
    @PostMapping("/{id}/accept") @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<?> accept(@PathVariable String id,@RequestAttribute("currentUser") User user) {return ApiResponse.ok(service.accept(id,user.getId()));}
    @PostMapping("/{id}/checkin")
    public ApiResponse<?> checkin(@PathVariable String id,@Valid @RequestBody Requests.Checkin body,@RequestAttribute("currentUser") User user) {return ApiResponse.ok(service.checkin(id,body,user.getId()));}
    @PostMapping("/{id}/reply") @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<?> reply(@PathVariable String id,@Valid @RequestBody Requests.ReplyCreate body,@RequestAttribute("currentUser") User user) {return ApiResponse.ok(service.submit(id,body,user));}
    @GetMapping("/{id}") public ApiResponse<?> detail(@PathVariable String id,@RequestAttribute("currentUser") User user) {return ApiResponse.ok(service.detail(id,user.getId()));}
}
