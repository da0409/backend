package com.hackathon.backend.controller;
import com.hackathon.backend.service.PoiService;
import com.hackathon.backend.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/v1/pois")
public class PoiController {
    private final PoiService service;
    public PoiController(PoiService service) {this.service=service;}
    @GetMapping("/search") public ApiResponse<?> search(@RequestParam String keyword,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="10") int pageSize) {return ApiResponse.ok(service.search(keyword,page,pageSize));}
    @GetMapping("/{id}") public ApiResponse<?> detail(@PathVariable String id) {return ApiResponse.ok(service.detail(id));}
    @GetMapping("/{id}/timeline") public ApiResponse<?> timeline(@PathVariable String id) {return ApiResponse.ok(service.timeline(id));}
}
