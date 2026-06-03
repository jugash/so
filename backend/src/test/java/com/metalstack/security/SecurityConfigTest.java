package com.metalstack.security;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecurityConfigTest {

    @Test
    void corsConfigurationSource_ConfiguredCorrectly() {
        KeycloakJwtConverter converter = mock(KeycloakJwtConverter.class);
        SecurityConfig config = new SecurityConfig(converter);
        ReflectionTestUtils.setField(config, "allowedOrigins", "http://localhost:3000,http://localhost:5173");

        CorsConfigurationSource source = config.corsConfigurationSource();
        assertNotNull(source);

        assertTrue(source instanceof org.springframework.web.cors.UrlBasedCorsConfigurationSource);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource urlSource = 
                (org.springframework.web.cors.UrlBasedCorsConfigurationSource) source;
        java.util.Map<String, CorsConfiguration> configs = urlSource.getCorsConfigurations();
        assertNotNull(configs);
        CorsConfiguration corsConfig = configs.get("/**");
        assertNotNull(corsConfig);
        assertTrue(corsConfig.getAllowCredentials());
        assertEquals(3600L, corsConfig.getMaxAge());
        assertTrue(corsConfig.getAllowedOrigins().contains("http://localhost:3000"));
        assertTrue(corsConfig.getAllowedOrigins().contains("http://localhost:5173"));
        assertTrue(corsConfig.getAllowedMethods().contains("GET"));
        assertTrue(corsConfig.getAllowedHeaders().contains("*"));
    }
}
