package com.hackathon.backend.config;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;
@Configuration
@MapperScan("com.hackathon.backend.mapper")
public class MybatisConfiguration {}
