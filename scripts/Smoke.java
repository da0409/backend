import java.net.*;
import java.net.http.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.regex.*;
import java.io.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

// Self-contained Java 25 smoke test. Creates explicitly synthetic local content.
public class Smoke {
    static final String BASE="http://127.0.0.1:8081/v1";
    static final HttpClient CLIENT=HttpClient.newHttpClient();
    static String call(String method,String path,String token,String body) throws Exception {
        var b=HttpRequest.newBuilder(URI.create(BASE+path)).timeout(Duration.ofSeconds(30));
        if(token!=null)b.header("Authorization","Bearer "+token);
        if(body!=null)b.header("Content-Type","application/json");
        b.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body));
        var r=CLIENT.send(b.build(),HttpResponse.BodyHandlers.ofString());
        if(r.statusCode()>=400)throw new IllegalStateException(method+" "+path+" HTTP "+r.statusCode());
        return r.body();
    }
    static String field(String text,String key) {
        var matcher=Pattern.compile("\""+key+"\":\"([^\"]+)\"").matcher(text);
        if(!matcher.find())throw new IllegalStateException("Missing response field "+key);
        return matcher.group(1);
    }
    static Map<String,String> register() throws Exception {
        String username="demo_"+UUID.randomUUID().toString().replace("-","").substring(0,12);
        String password=UUID.randomUUID().toString();
        String result=call("POST","/auth/register",null,"{\"username\":\""+username+"\",\"password\":\""+password+"\",\"nickname\":\"比赛模拟用户\"}");
        return Map.of("username",username,"password",password,"token",field(result,"token"));
    }
    public static void main(String[] args) throws Exception {
        Path access=Path.of(".local/demo.properties");
        if(args.length>0&&args[0].equals("verify")) {
            var data=new Properties();try(var in=Files.newInputStream(access)){data.load(in);}
            String login=call("POST","/auth/login",null,"{\"username\":\""+data.getProperty("username")+"\",\"password\":\""+data.getProperty("password")+"\"}");
            String detail=call("GET","/capsules/"+data.getProperty("capsule"),field(login,"token"),null);
            if(!detail.contains("ANSWERED"))throw new IllegalStateException("Missing persisted reply");
            System.out.println("PASS: Java service data persisted across restart");
            return;
        }
        var author=register();var traveler=register();
        ByteArrayOutputStream image=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(32,24,BufferedImage.TYPE_INT_RGB),"png",image);
        String boundary="JavaSmokeBoundary";
        ByteArrayOutputStream multipart=new ByteArrayOutputStream();
        multipart.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"demo.png\"\r\nContent-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        multipart.write(image.toByteArray());multipart.write(("\r\n--"+boundary+"--\r\n").getBytes(StandardCharsets.UTF_8));
        var upload=CLIENT.send(HttpRequest.newBuilder(URI.create(BASE+"/capsules/media")).header("Authorization","Bearer "+author.get("token"))
            .header("Content-Type","multipart/form-data; boundary="+boundary).POST(HttpRequest.BodyPublishers.ofByteArray(multipart.toByteArray())).build(),HttpResponse.BodyHandlers.ofString());
        if(upload.statusCode()!=201)throw new IllegalStateException("Upload failed");
        String media=field(upload.body(),"mediaId");
        LocalDate today=LocalDate.now(ZoneId.of("Asia/Shanghai"));
        String c=call("POST","/capsules",author.get("token"),"""
            {"title":"比赛模拟：纯 Java 联调","question":"这是自动联调生成的模拟内容。",
             "poiId":"java_demo_poi","poiName":"比赛模拟地点","lng":100.1789,"lat":27.1156,
             "mediaList":[{"mediaId":"%s","caption":"程序生成的模拟图片"}],
             "answerBeginTime":"%s","answerEndTime":"%s","blurFace":false}
            """.formatted(media,today,today.plusDays(30)));
        String capsule=field(c,"capsuleId");
        String matches=call("GET","/tasks/recommend?destinationPoiId=java_demo_poi&travelBeginDate="+today+"&travelEndDate="+today,traveler.get("token"),null);
        if(!matches.contains(capsule))throw new IllegalStateException("Recommendation missing");
        String a=field(call("POST","/tasks/"+capsule+"/accept",traveler.get("token"),null),"assignmentId");
        call("POST","/tasks/"+a+"/checkin",traveler.get("token"),"{\"lng\":100.1789,\"lat\":27.1156}");
        call("POST","/tasks/"+a+"/reply",traveler.get("token"),"{\"content\":\"比赛模拟回信，并非真实现场观察。\"}");
        if(!call("GET","/capsules/"+capsule,author.get("token"),null).contains("ANSWERED"))throw new IllegalStateException("Reply not visible");
        call("GET","/pois/java_demo_poi/timeline",author.get("token"),null);
        Properties saved=new Properties();saved.setProperty("username",author.get("username"));saved.setProperty("password",author.get("password"));saved.setProperty("capsule",capsule);
        try(var out=Files.newOutputStream(access)){saved.store(out,"Local synthetic demo access; never commit");}
        Files.setPosixFilePermissions(access,java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
        System.out.println("PASS: Java live register/upload/create/recommend/accept/checkin/reply/timeline");
    }
}
