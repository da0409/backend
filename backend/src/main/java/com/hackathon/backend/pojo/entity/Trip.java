package com.hackathon.backend.pojo.entity;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Trip {
    private String id;
    private String travelerId;
    private String poiId;
    private LocalDate arrivalDate;
    private LocalDate departureDate;
    private Boolean participatesInMatching;
    private Boolean active;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
