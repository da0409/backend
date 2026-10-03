package com.hackathon.backend;
import org.junit.jupiter.api.Test;
import java.nio.file.*;

import static org.junit.jupiter.api.Assertions.*;
class ArchitectureTests {
    @Test void controllersDependOnServicesNotMappers() throws Exception {
        try(var files=Files.list(Path.of("src/main/java/com/hackathon/backend/controller"))) {
            for(Path path:files.toList()) {
                String code=Files.readString(path);
                assertFalse(code.contains(".mapper."),path.toString());
                assertFalse(code.contains("JdbcTemplate"),path.toString());
                assertTrue(code.contains(".service."),path.toString());
            }
        }
    }

}
