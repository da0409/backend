#include "geo.hpp"
#include <cmath>
#include <limits>
#include <stdexcept>
int main() {
    if (distance_meters(0,0,0,0) != 0) return 1;
    const double unit = 180 / 3.14159265358979323846 / 6371000;
    if (distance_meters(0,0,0,299.9*unit) >= 300) return 2;
    if (distance_meters(0,0,0,300.1*unit) <= 300) return 3;
    if (distance_meters(179.999,0,-179.999,0) >= 300) return 4;
    if (!std::isfinite(distance_meters(0,0,180,0))) return 5;
    try { distance_meters(181,0,0,0); return 6; } catch (const std::invalid_argument&) {}
    try { distance_meters(0,std::numeric_limits<double>::quiet_NaN(),0,0); return 7; } catch (const std::invalid_argument&) {}
    return 0;
}
