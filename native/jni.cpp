#include "geo.hpp"
#include <jni.h>
#include <stdexcept>
extern "C" JNIEXPORT jdouble JNICALL
Java_com_hackathon_backend_nativegeo_NativeGeo_distance(JNIEnv* env, jclass, jdouble a, jdouble b, jdouble c, jdouble d) {
    try { return distance_meters(a,b,c,d); }
    catch (const std::invalid_argument& e) {
        env->ThrowNew(env->FindClass("java/lang/IllegalArgumentException"), e.what());
        return 0;
    }
}
