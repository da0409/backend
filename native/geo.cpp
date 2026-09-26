#include "geo.hpp"
#include <algorithm>
#include <cmath>
#include <stdexcept>

double distance_meters(double lng1, double lat1, double lng2, double lat2) {
    if (!std::isfinite(lng1) || !std::isfinite(lat1) || !std::isfinite(lng2) || !std::isfinite(lat2)
        || std::abs(lng1) > 180 || std::abs(lng2) > 180 || std::abs(lat1) > 90 || std::abs(lat2) > 90)
        throw std::invalid_argument("Invalid coordinates");
    constexpr double radians = 3.14159265358979323846 / 180;
    const double a = lat1 * radians, b = lat2 * radians;
    const double dlat = (lat2-lat1)*radians, dlng = (lng2-lng1)*radians;
    const double h = std::pow(std::sin(dlat/2),2) + std::cos(a)*std::cos(b)*std::pow(std::sin(dlng/2),2);
    return 6371000 * 2 * std::asin(std::sqrt(std::clamp(h, 0.0, 1.0)));
}
