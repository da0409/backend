package com.hackathon.backend;

import com.hackathon.backend.geo.GeoDistance;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GeoDistanceTests {
    @Test void identicalPointsHaveZeroDistance() {
        assertEquals(0, GeoDistance.distance(116.4, 39.9, 116.4, 39.9));
    }

    @Test void equatorialDegreeHasKnownDistance() {
        assertEquals(111194.92664455874, GeoDistance.distance(0, 0, 1, 0), 0.000001);
    }

    @Test void checkinBoundaryRemainsThreeHundredMeters() {
        double degreesPerMeter = 180 / Math.PI / 6_371_000;
        assertEquals(299.9, GeoDistance.distance(0, 0, 0, 299.9 * degreesPerMeter), 1e-8);
        assertTrue(GeoDistance.distance(0, 0, 0, 299.9 * degreesPerMeter) < 300);
        assertTrue(GeoDistance.distance(0, 0, 0, 300.1 * degreesPerMeter) > 300);
    }

    @Test void crossesDateLineByShortestDistance() {
        assertEquals(222.38985329, GeoDistance.distance(179.999, 0, -179.999, 0), 0.00001);
        assertEquals(0, GeoDistance.distance(-180, 0, 180, 0), 1e-8);
    }

    @Test void antipodesAndPolesRemainFinite() {
        assertEquals(20_015_086.79602057, GeoDistance.distance(0, 0, 180, 0), 1e-6);
        assertEquals(20_015_086.79602057, GeoDistance.distance(0, -90, 0, 90), 1e-6);
        assertEquals(0, GeoDistance.distance(-120, 90, 120, 90), 1e-8);
        assertTrue(Double.isFinite(GeoDistance.distance(12.3, 45.6, -167.7, -45.6)));
    }

    @Test void distanceIsSymmetric() {
        assertEquals(GeoDistance.distance(116.4, 39.9, 121.5, 31.2),
                GeoDistance.distance(121.5, 31.2, 116.4, 39.9), 1e-8);
    }

    @Test void rejectsInvalidCoordinatesInEveryPosition() {
        for (int index = 0; index < 4; index++) {
            double limit = index % 2 == 0 ? 180 : 90;
            for (double invalid : new double[]{Double.NaN, Double.POSITIVE_INFINITY,
                    Double.NEGATIVE_INFINITY, limit + 0.01, -limit - 0.01}) {
                double[] point = {0, 0, 0, 0};
                point[index] = invalid;
                assertThrows(IllegalArgumentException.class,
                        () -> GeoDistance.distance(point[0], point[1], point[2], point[3]));
            }
        }
    }
}
