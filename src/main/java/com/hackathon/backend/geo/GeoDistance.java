package com.hackathon.backend.geo;

/** Great-circle distance in meters using the mean Earth radius. */
public final class GeoDistance {
    private static final double EARTH_RADIUS_METERS = 6_371_000;

    private GeoDistance() {}

    public static double distance(double lng1, double lat1, double lng2, double lat2) {
        validate(lng1, lat1);
        validate(lng2, lat2);
        double latitude1 = Math.toRadians(lat1);
        double latitude2 = Math.toRadians(lat2);
        double sinLatitude = Math.sin(Math.toRadians(lat2 - lat1) / 2);
        double sinLongitude = Math.sin(Math.toRadians(lng2 - lng1) / 2);
        double haversine = sinLatitude * sinLatitude
                + Math.cos(latitude1) * Math.cos(latitude2) * sinLongitude * sinLongitude;
        // Clamp rounding errors near antipodal points.
        return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.clamp(haversine, 0, 1)));
    }

    private static void validate(double lng, double lat) {
        if (!Double.isFinite(lng) || !Double.isFinite(lat)
                || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
            throw new IllegalArgumentException("Invalid coordinates");
        }
    }
}
