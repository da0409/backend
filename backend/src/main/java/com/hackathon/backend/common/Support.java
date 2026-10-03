package com.hackathon.backend.common;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
public final class Support {
    private Support() {}
    public static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    public static LocalDateTime now() { return LocalDateTime.now(ZONE); }
    public static LocalDate today() { return LocalDate.now(ZONE); }
    public static String id(String prefix) { return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0,24); }
    public static String time(LocalDateTime value) { return value == null ? null : value.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")); }
    public static Map<String,Object> map(Object... pairs) {
        Map<String,Object> result = new LinkedHashMap<>();
        for (int i=0; i<pairs.length; i+=2) result.put((String)pairs[i], pairs[i+1]);
        return result;
    }
    public static Map<String,Object> page(List<?> items, int page, int size) {
        BusinessException.require(page>=1 && size>=1 && size<=100,422,"分页范围无效");
        int start = (int)Math.min(items.size(), ((long)page-1)*size);
        return map("total",items.size(),"rows",items.subList(start,Math.min(items.size(),start+size)));
    }
}
