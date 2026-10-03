package com.hackathon.backend.controller;
import com.hackathon.backend.service.TripService;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.pojo.entity.User;
import com.hackathon.backend.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/trips")
public class TripController {
    private final TripService service;
    public TripController(TripService service) { this.service=service; }
    @GetMapping public ApiResponse<?> list(@RequestAttribute("currentUser") User user,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="10") int pageSize) {
        return ApiResponse.ok(service.list(user.getId(),page,pageSize));
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> create(@Valid @RequestBody Requests.TripInput body,@RequestAttribute("currentUser") User user) {
        return ApiResponse.ok(service.create(body,user.getId()));
    }
    @GetMapping("/active") public ApiResponse<?> active(@RequestAttribute("currentUser") User user) { return ApiResponse.ok(service.active(user.getId())); }
    @PutMapping("/active") public ApiResponse<?> select(@Valid @RequestBody Requests.ActiveTrip body,@RequestAttribute("currentUser") User user) {
        return ApiResponse.ok(service.select(body.tripId(),user.getId()));
    }
    @DeleteMapping("/active") public ApiResponse<?> clear(@RequestAttribute("currentUser") User user) {service.clearActive(user.getId());return ApiResponse.ok(null);}
    @GetMapping("/{id}") public ApiResponse<?> detail(@PathVariable String id,@RequestAttribute("currentUser") User user) {
        return ApiResponse.ok(service.detail(id,user.getId()));
    }
    @PutMapping("/{id}") public ApiResponse<?> update(@PathVariable String id,@Valid @RequestBody Requests.TripInput body,@RequestAttribute("currentUser") User user) {
        return ApiResponse.ok(service.update(id,body,user.getId()));
    }
    @DeleteMapping("/{id}") public ApiResponse<?> delete(@PathVariable String id,@RequestAttribute("currentUser") User user) {service.delete(id,user.getId());return ApiResponse.ok(null);}
    @GetMapping("/{id}/matches") public ApiResponse<?> matches(@PathVariable String id,@RequestAttribute("currentUser") User user,
            @RequestParam(defaultValue="3000") int radiusMeters,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="10") int pageSize) {
        return ApiResponse.ok(service.matches(id,user.getId(),radiusMeters,page,pageSize));
    }
}
