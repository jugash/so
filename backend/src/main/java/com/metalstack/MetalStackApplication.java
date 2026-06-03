package com.metalstack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MetalStackApplication {

    public static void main(String[] args) {
        SpringApplication.run(MetalStackApplication.class, args);
    }
}
