package com.hackathon.backend;
import org.junit.jupiter.api.Test;
import java.nio.file.*;
import com.hackathon.backend.nativegeo.NativeGeo;
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
    @Test void nativeLibraryValidatesCoordinatesAndCrossesDateLine() {
        assertEquals(0,NativeGeo.distance(0,0,0,0));
        assertTrue(NativeGeo.distance(179.999,0,-179.999,0)<300);
        assertThrows(IllegalArgumentException.class,()->NativeGeo.distance(181,0,0,0));
        assertThrows(IllegalArgumentException.class,()->NativeGeo.distance(0,Double.NaN,0,0));
    }
}
