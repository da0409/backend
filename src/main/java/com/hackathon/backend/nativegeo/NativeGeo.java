package com.hackathon.backend.nativegeo;
import java.nio.file.Path;

public final class NativeGeo {
    static {
        System.load(Path.of(System.getProperty("geo.library", "target/native/libtimecapsule_geo.so")).toAbsolutePath().toString());
    }
    private NativeGeo() {}
    public static native double distance(double lng1, double lat1, double lng2, double lat2);
}
