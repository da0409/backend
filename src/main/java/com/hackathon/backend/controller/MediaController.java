package com.hackathon.backend.controller;
import com.hackathon.backend.service.MediaService;
import com.hackathon.backend.pojo.entity.User;
import com.hackathon.backend.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import org.springframework.core.io.*;
@RestController
public class MediaController {
    private final MediaService service;
    public MediaController(MediaService service) {this.service=service;}
    @PostMapping("/v1/capsules/media") @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> upload(@RequestParam("file") MultipartFile file,@RequestParam(required=false) String type,@RequestAttribute("currentUser") User user) {
        return ApiResponse.ok(service.upload(file,type,user.getId()));
    }
    @GetMapping("/v1/media/{id}")
    public ResponseEntity<Resource> read(@PathVariable String id,@RequestAttribute("currentUser") User user) {
        var m=service.readable(id,user.getId());
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(m.getMime())).header("X-Content-Type-Options","nosniff")
            .cacheControl(CacheControl.noStore()).body(new FileSystemResource(service.path(m)));
    }
}
