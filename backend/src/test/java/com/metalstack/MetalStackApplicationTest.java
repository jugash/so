package com.metalstack;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class MetalStackApplicationTest {

    @Test
    void contextLoads() {
        // Verifies that the context starts successfully with the 'test' profile
    }
}
