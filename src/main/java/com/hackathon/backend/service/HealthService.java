package com.hackathon.backend.service;
import com.hackathon.backend.mapper.HealthMapper;
import org.springframework.stereotype.Service;
import java.util.Map;
@Service
public class HealthService {
    private final HealthMapper mapper;
    public HealthService(HealthMapper mapper){this.mapper=mapper;}
    public Map<String,Object> health(){return Map.of("status",mapper.ping()==1?"ok":"error","database","mysql","runtime","java25");}
}
