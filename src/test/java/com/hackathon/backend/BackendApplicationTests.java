package com.hackathon.backend;

import com.hackathon.backend.common.Support;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.io.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class BackendApplicationTests {
    @DynamicPropertySource
    static void databaseGuard(DynamicPropertyRegistry registry) {
        String url=System.getenv("DB_URL");
        if(url==null||!url.contains("/capsule_java_test?"))throw new IllegalStateException("Use scripts/test.sh with the dedicated MySQL test database");
    }
    @Autowired Environment environment;
    @Autowired JdbcTemplate db;
    private final HttpClient client=HttpClient.newHttpClient();
    private final JsonMapper json=JsonMapper.builder().build();
    private String base(){return "http://127.0.0.1:"+environment.getProperty("local.server.port")+"/v1";}
    record Response(int status,JsonNode body) { JsonNode data(){return body.get("data");} }
    record Account(String token,String id,String username,String password) {}
    record Created(String id,Map<String,Object> payload) {}
    @BeforeEach void clean() {
        String database=db.queryForObject("SELECT DATABASE()",String.class);
        assertEquals("capsule_java_test",database);
        for(String table:List.of("t_reply_media","t_capsule_media","t_reply","t_assignment","t_capsule","t_media","t_auth_session","t_poi","t_user"))
            db.execute("DELETE FROM "+table);
    }
    private Response request(String method,String path,String token,Object body) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create(base()+path)).timeout(Duration.ofSeconds(30));
        if(token!=null)builder.header("Authorization","Bearer "+token);
        if(body==null)builder.method(method,HttpRequest.BodyPublishers.noBody());
        else builder.header("Content-Type","application/json").method(method,HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        var response=client.send(builder.build(),HttpResponse.BodyHandlers.ofString());
        return new Response(response.statusCode(),json.readTree(response.body()));
    }
    private Account account() throws Exception {
        String name="t_"+UUID.randomUUID().toString().replace("-","").substring(0,12);
        String password=UUID.randomUUID().toString();
        var r=request("POST","/auth/register",null,Map.of("username",name,"password",password,"nickname","测试旅行者"));
        assertEquals(201,r.status(),r.body().toString());
        return new Account(r.data().get("token").asText(),r.data().get("user").get("userId").asText(),name,password);
    }
    private Response upload(Account a,String filename,byte[] data) throws Exception {
        String boundary="TestBoundary"+UUID.randomUUID();
        ByteArrayOutputStream output=new ByteArrayOutputStream();
        output.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\""+filename+"\"\r\nContent-Type: application/octet-stream\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(data);output.write(("\r\n--"+boundary+"--\r\n").getBytes(StandardCharsets.UTF_8));
        var req=HttpRequest.newBuilder(URI.create(base()+"/capsules/media")).header("Authorization","Bearer "+a.token())
            .header("Content-Type","multipart/form-data; boundary="+boundary).POST(HttpRequest.BodyPublishers.ofByteArray(output.toByteArray())).build();
        var result=client.send(req,HttpResponse.BodyHandlers.ofString());
        return new Response(result.statusCode(),json.readTree(result.body()));
    }
    private String picture(Account a) throws Exception {
        var bytes=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(12,8,BufferedImage.TYPE_INT_RGB),"png",bytes);
        var r=upload(a,"test.png",bytes.toByteArray());assertEquals(201,r.status(),r.body().toString());return r.data().get("mediaId").asText();
    }
    private Created capsule(Account a,Map<String,Object> overrides) throws Exception {
        Map<String,Object> body=new LinkedHashMap<>();
        body.putAll(Map.of("title","许愿牌还在吗","question","请帮忙看看","poiId","poi_test","poiName","测试地点","lng",100.1789,"lat",27.1156,
            "mediaList",List.of(Map.of("mediaId",picture(a))),"answerBeginTime",Support.today().toString(),"answerEndTime",Support.today().plusDays(7).toString(),"blurFace",false));
        body.putAll(overrides);var r=request("POST","/capsules",a.token(),body);assertEquals(201,r.status(),r.body().toString());
        return new Created(r.data().get("capsuleId").asText(),body);
    }
    private String accept(Account a,String capsule) throws Exception {
        var r=request("POST","/tasks/"+capsule+"/accept",a.token(),null);assertEquals(201,r.status(),r.body().toString());return r.data().get("assignmentId").asText();
    }
    private Response checkin(Account a,String assignment) throws Exception {return request("POST","/tasks/"+assignment+"/checkin",a.token(),Map.of("lng",100.1789,"lat",27.1156));}
    private Response reply(Account a,String assignment) throws Exception {return request("POST","/tasks/"+assignment+"/reply",a.token(),Map.of("content","模拟现场回信"));}
    private String recommendQuery(){return "/tasks/recommend?destinationPoiId=poi_test&travelBeginDate="+Support.today()+"&travelEndDate="+Support.today();}

    @Test void completeHttpFlowPersistsAndBuildsTimeline() throws Exception {
        var owner=account();var traveler=account();var c=capsule(owner,Map.of());
        assertEquals(1,request("GET",recommendQuery(),traveler.token(),null).data().get("total").asInt());
        String a=accept(traveler,c.id());assertEquals(200,checkin(traveler,a).status());
        var r=reply(traveler,a);assertEquals(201,r.status(),r.body().toString());
        assertEquals("ANSWERED",request("GET","/capsules/"+c.id(),owner.token(),null).data().get("status").asText());
        assertEquals(1,request("GET","/pois/poi_test/timeline",owner.token(),null).data().get("total").asInt());
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM t_reply",Integer.class));
        assertEquals("COMPLETED",request("GET","/tasks/"+a,traveler.token(),null).data().get("status").asText());
        assertEquals(1,request("GET","/replies?capsuleId="+c.id(),owner.token(),null).data().get("total").asInt());
    }
    @Test void authHashLoginLogoutAndExpiry() throws Exception {
        var a=account();
        assertEquals(401,request("GET","/auth/me",null,null).status());
        assertEquals(401,request("POST","/auth/login",null,Map.of("username",a.username(),"password",UUID.randomUUID().toString())).status());
        assertEquals(200,request("POST","/auth/login",null,Map.of("username",a.username(),"password",a.password())).status());
        assertNotEquals(a.password(),db.queryForObject("SELECT password FROM t_user WHERE id=?",String.class,a.id()));
        assertEquals(200,request("POST","/auth/logout",a.token(),null).status());
        assertEquals(401,request("GET","/auth/me",a.token(),null).status());
        var login=request("POST","/auth/login",null,Map.of("username",a.username(),"password",a.password()));
        db.update("UPDATE t_auth_session SET expires_at=DATE_SUB(NOW(),INTERVAL 1 DAY)");
        assertEquals(401,request("GET","/auth/me",login.data().get("token").asText(),null).status());
    }
    @Test void ownershipAndAssignmentIsolation() throws Exception {
        var owner=account();var other=account();var stranger=account();var c=capsule(owner,Map.of());
        assertEquals(403,request("POST","/tasks/"+c.id()+"/accept",owner.token(),null).status());
        String a=accept(other,c.id());
        assertEquals(404,checkin(stranger,a).status());
        assertEquals(404,request("GET","/tasks/"+a,stranger.token(),null).status());
        assertEquals(403,request("PUT","/capsules",other.token(),Map.of("capsuleId",c.id(),"title","wrong")).status());
        assertEquals(403,request("DELETE","/capsules/"+c.id(),other.token(),null).status());
    }
    @Test void stateTransitionsAndCascade() throws Exception {
        var owner=account();var t=account();var c=capsule(owner,Map.of());String a=accept(t,c.id());
        assertEquals(409,request("POST","/tasks/"+c.id()+"/accept",t.token(),null).status());
        assertEquals(409,reply(t,a).status());assertEquals(200,checkin(t,a).status());assertEquals(201,reply(t,a).status());
        assertEquals(409,reply(t,a).status());assertEquals(409,checkin(t,a).status());
        assertEquals(409,request("PUT","/capsules",owner.token(),Map.of("capsuleId",c.id(),"title","new")).status());
        assertEquals(200,request("DELETE","/capsules/"+c.id(),owner.token(),null).status());
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM t_assignment",Integer.class));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM t_reply",Integer.class));
    }
    @Test void checkinUsesNativeDistanceBoundary() throws Exception {
        var o=account();var t=account();var c=capsule(o,Map.of());String a=accept(t,c.id());
        double unit=180/Math.PI/6371000;
        assertEquals(422,request("POST","/tasks/"+a+"/checkin",t.token(),Map.of("lng",100.1789,"lat",27.1156+300.1*unit)).status());
        assertEquals(200,request("POST","/tasks/"+a+"/checkin",t.token(),Map.of("lng",100.1789,"lat",27.1156+299.9*unit)).status());
    }
    @Test void datesAndStaleCheckin() throws Exception {
        var o=account();var t=account();var c=capsule(o,Map.of("answerBeginTime",Support.today().plusDays(1).toString()));String a=accept(t,c.id());
        assertEquals(409,checkin(t,a).status());
        db.update("UPDATE t_capsule SET answer_begin_time=? WHERE id=?",Support.today(),c.id());assertEquals(200,checkin(t,a).status());
        db.update("UPDATE t_assignment SET checkin_time=DATE_SUB(NOW(),INTERVAL 1 DAY) WHERE id=?",a);
        assertEquals(409,reply(t,a).status());
        db.update("UPDATE t_capsule SET answer_begin_time=?,answer_end_time=? WHERE id=?",Support.today().minusDays(2),Support.today().minusDays(1),c.id());
        assertEquals("EXPIRED",request("GET","/tasks/"+a,t.token(),null).data().get("status").asText());
    }
    @Test void validationRejectsBadDatesCoordinatesPaginationAndEmptyReply() throws Exception {
        var o=account();var t=account();var c=capsule(o,Map.of());
        for(var change:List.of(Map.<String,Object>of("lat",91),Map.<String,Object>of("title"," "),Map.<String,Object>of("answerBeginTime","2099-01-01"))) {
            var p=new LinkedHashMap<>(c.payload());p.putAll(change);assertEquals(422,request("POST","/capsules",o.token(),p).status());
        }
        assertEquals(422,request("GET","/capsules?pageSize=101",o.token(),null).status());
        String a=accept(t,c.id());assertEquals(200,checkin(t,a).status());
        assertEquals(422,request("POST","/tasks/"+a+"/reply",t.token(),Map.of()).status());
    }
    @Test void matchingFiltersDistanceDatesAndOwnContent() throws Exception {
        var o=account();var t=account();capsule(o,Map.of());
        capsule(o,Map.of("poiId","near","poiName","附近","lat",27.1166));
        capsule(o,Map.of("poiId","far","poiName","远处","lat",28.0));
        capsule(o,Map.of("answerBeginTime",Support.today().plusDays(2).toString()));
        capsule(t,Map.of());
        var r=request("GET",recommendQuery(),t.token(),null);assertEquals(2,r.data().get("total").asInt());
        assertEquals(0,r.data().get("rows").get(0).get("distanceMeters").asInt());
        assertEquals(422,request("GET",recommendQuery()+"&radiusMeters=10001",t.token(),null).status());
    }
    @Test void mediaOwnershipAndInvalidFormats() throws Exception {
        var a=account();var b=account();String id=picture(a);
        assertEquals(403,request("GET","/media/"+id,b.token(),null).status());
        assertEquals(415,upload(a,"fake.png","not an image".getBytes()).status());
        assertEquals(415,upload(a,"bad.html","hi".getBytes()).status());
        assertEquals(422,upload(a,"empty.png",new byte[0]).status());
        var c=capsule(a,Map.of());assertEquals(403,request("POST","/capsules",b.token(),c.payload()).status());
    }
    @Test void privacyIsNeverFaked() throws Exception {
        var a=account();var c=capsule(a,Map.of());var p=new LinkedHashMap<>(c.payload());p.put("blurFace",true);
        assertEquals(501,request("POST","/capsules",a.token(),p).status());
        assertEquals(501,request("POST","/ai/compare",a.token(),Map.of("capsuleId",c.id())).status());
        assertTrue(request("GET","/pois/poi_test",a.token(),null).data().get("changeSummary").isNull());
    }
    @Test void deleteReplyUpdatesTimelineButDoesNotReopenAssignment() throws Exception {
        var o=account();var t=account();var x=account();var c=capsule(o,Map.of());String a=accept(t,c.id());checkin(t,a);
        String r=reply(t,a).data().get("replyId").asText();
        assertEquals(403,request("DELETE","/replies/"+r,x.token(),null).status());
        assertEquals(200,request("DELETE","/replies/"+r,o.token(),null).status());
        assertEquals("WAITING",request("GET","/capsules/"+c.id(),o.token(),null).data().get("status").asText());
        assertEquals(0,request("GET","/pois/poi_test/timeline",o.token(),null).data().get("total").asInt());
        assertEquals(409,reply(t,a).status());
    }
    @Test void concurrentAcceptAndReplyCannotDuplicate() throws Exception {
        var o=account();var t=account();var c=capsule(o,Map.of());
        try(var pool=Executors.newFixedThreadPool(2)) {
            List<Callable<Response>> jobs=List.of(()->request("POST","/tasks/"+c.id()+"/accept",t.token(),null),()->request("POST","/tasks/"+c.id()+"/accept",t.token(),null));
            var results=pool.invokeAll(jobs).stream().map(f->{try{return f.get();}catch(Exception e){throw new RuntimeException(e);}}).toList();
            assertEquals(List.of(201,409),results.stream().map(Response::status).sorted().toList());
            String a=results.stream().filter(r->r.status()==201).findFirst().orElseThrow().data().get("assignmentId").asText();
            checkin(t,a);
            var replies=pool.invokeAll(List.<Callable<Response>>of(()->reply(t,a),()->reply(t,a))).stream().map(f->{try{return f.get().status();}catch(Exception e){throw new RuntimeException(e);}}).sorted().toList();
            assertEquals(List.of(201,409),replies);
        }
    }
    @Test void healthAndCurrentUserDoNotExposePassword() throws Exception {
        var a=account();var health=request("GET","/health",null,null).data();
        assertEquals("mysql",health.get("database").asText());assertEquals("java25",health.get("runtime").asText());
        var user=request("GET","/auth/me",a.token(),null);
        assertEquals(a.id(),user.data().get("userId").asText());assertFalse(user.body().toString().contains(a.password()));
    }
    @Test void videoAudioAndOversizedImageValidation() throws Exception {
        var a=account();
        java.nio.file.Path dir=java.nio.file.Files.createTempDirectory("java-media-test-");
        try {
            var video=dir.resolve("sample.mp4");
            var audio=dir.resolve("sample.wav");
            Process vp=new ProcessBuilder("ffmpeg","-v","error","-f","lavfi","-i","color=c=blue:s=32x32:d=1","-c:v","mpeg4",video.toString()).start();
            assertEquals(0,vp.waitFor());
            Process ap=new ProcessBuilder("ffmpeg","-v","error","-f","lavfi","-i","anullsrc=r=8000:cl=mono","-t","1",audio.toString()).start();
            assertEquals(0,ap.waitFor());
            var vr=upload(a,"sample.mp4",java.nio.file.Files.readAllBytes(video));assertEquals(201,vr.status(),vr.body().toString());assertEquals("VIDEO",vr.data().get("type").asText());
            var ar=upload(a,"sample.wav",java.nio.file.Files.readAllBytes(audio));assertEquals(201,ar.status(),ar.body().toString());assertEquals("AUDIO",ar.data().get("type").asText());
            assertEquals(413,upload(a,"large.png",new byte[20*1024*1024+1]).status());
        } finally {
            java.nio.file.Files.deleteIfExists(dir.resolve("sample.mp4"));
            java.nio.file.Files.deleteIfExists(dir.resolve("sample.wav"));
            java.nio.file.Files.deleteIfExists(dir);
        }
    }
    @Test void mediaOnlyReplyRejectsAnotherUsersAsset() throws Exception {
        var o=account();var t=account();var c=capsule(o,Map.of());String a=accept(t,c.id());checkin(t,a);
        assertEquals(403,request("POST","/tasks/"+a+"/reply",t.token(),Map.of("mediaList",c.payload().get("mediaList"),"blurFace",false)).status());
        assertEquals(201,request("POST","/tasks/"+a+"/reply",t.token(),Map.of("mediaList",List.of(Map.of("mediaId",picture(t))),"blurFace",false)).status());
    }
    @Test void longUnicodePasswordReturnsValidationError() throws Exception {
        assertEquals(422,request("POST","/auth/login",null,Map.of("username","unknown","password","汉".repeat(40))).status());
    }
}
