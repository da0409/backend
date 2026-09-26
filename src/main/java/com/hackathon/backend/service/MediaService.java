package com.hackathon.backend.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.hackathon.backend.mapper.*;
import com.hackathon.backend.pojo.entity.*;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.common.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import static com.hackathon.backend.common.Support.*;
import static com.hackathon.backend.common.BusinessException.require;

@Service
public class MediaService {
    private final MediaMapper media;
    private final CapsuleMediaMapper capsuleMedia;
    private final ReplyMediaMapper replyMedia;
    private final Path root;
    public MediaService(MediaMapper media,CapsuleMediaMapper cm,ReplyMediaMapper rm,@Value("${app.media-dir}") String path) {
        this.media=media; this.capsuleMedia=cm; this.replyMedia=rm; this.root=Path.of(path).toAbsolutePath().normalize();
        try { Files.createDirectories(root); } catch(IOException e) { throw new IllegalStateException("Cannot create media directory",e); }
    }
    public static void privacy(Boolean flag, boolean hasMedia) {
        require(!hasMedia||Boolean.FALSE.equals(flag),501,"人脸模糊尚未实现，请明确设置 blurFace=false");
    }
    public List<Media> validate(List<Requests.MediaRef> refs,String owner,boolean capsule) {
        List<Media> items=new ArrayList<>(); Set<String> ids=new HashSet<>();
        for(Requests.MediaRef ref: refs==null?List.<Requests.MediaRef>of():refs) {
            require(ids.add(ref.mediaId()),422,"素材重复");
            Media m=media.selectById(ref.mediaId());
            require(m!=null&&owner.equals(m.getUploaderId()),403,"素材不存在或不属于当前用户");
            require(!capsule||!m.getType().equals("AUDIO"),422,"参照素材仅允许图片或视频");
            require(ref.type()==null||ref.type().equals(m.getType()),422,"素材类型不一致");
            items.add(m);
        }
        return items;
    }
    public Map<String,Object> view(Media m) {
        return map("mediaId",m.getId(),"url","/v1/media/"+m.getId(),"type",m.getType(),"width",m.getWidth(),"height",m.getHeight(),"duration",m.getDuration());
    }
    public List<Map<String,Object>> capsuleRefs(String id) {
        return capsuleMedia.selectList(new QueryWrapper<CapsuleMedia>().eq("capsule_id",id).orderByAsc("id")).stream().map(r->{
            Map<String,Object> v=view(media.selectById(r.getMediaId())); v.put("caption",r.getCaption()); return v;
        }).toList();
    }
    public List<Map<String,Object>> replyRefs(String id) {
        return replyMedia.selectList(new QueryWrapper<ReplyMedia>().eq("reply_id",id).orderByAsc("id")).stream().map(r->{
            Map<String,Object> v=view(media.selectById(r.getMediaId())); v.put("caption",r.getCaption()); return v;
        }).toList();
    }
    public void saveCapsuleRefs(String id,List<Requests.MediaRef> refs,String owner) {
        List<Media> items=validate(refs,owner,true);
        capsuleMedia.delete(new QueryWrapper<CapsuleMedia>().eq("capsule_id",id));
        for(int i=0;i<items.size();i++) {
            Media m=items.get(i); CapsuleMedia r=new CapsuleMedia();
            r.setCapsuleId(id);r.setMediaId(m.getId());r.setType(m.getType());r.setUrl(m.getUrl());r.setCaption(refs.get(i).caption());r.setCreateTime(now());
            capsuleMedia.insert(r);
        }
    }
    public void saveReplyRefs(String id,List<Requests.MediaRef> refs,String owner) {
        List<Media> items=validate(refs,owner,false);
        for(int i=0;i<items.size();i++) {
            Media m=items.get(i); ReplyMedia r=new ReplyMedia();
            r.setReplyId(id);r.setMediaId(m.getId());r.setType(m.getType());r.setUrl(m.getUrl());r.setCaption(refs.get(i).caption());r.setCreateTime(now());
            replyMedia.insert(r);
        }
    }
    private String probe(Path file,String entries) throws IOException,InterruptedException {
        Path output=Files.createTempFile(root,"probe-",".txt");
        try {
            Process p=new ProcessBuilder("ffprobe","-v","error","-protocol_whitelist","file,pipe",
                "-show_entries",entries,"-of","default=noprint_wrappers=1",file.toString()).redirectError(ProcessBuilder.Redirect.DISCARD).redirectOutput(output.toFile()).start();
            if(!p.waitFor(15,TimeUnit.SECONDS)) { p.destroyForcibly(); throw new BusinessException(415,"素材解析超时"); }
            require(p.exitValue()==0&&Files.size(output)<65536,415,"素材格式无效");
            return Files.readString(output);
        } finally { Files.deleteIfExists(output); }
    }
    @Transactional
    public Map<String,Object> upload(MultipartFile file,String suppliedType,String owner) {
        String name=Optional.ofNullable(file.getOriginalFilename()).orElse("").toLowerCase(Locale.ROOT);
        String ext=name.contains(".")?name.substring(name.lastIndexOf('.')):"";
        String type=switch(ext) {case ".jpg",".jpeg",".png",".webp"->"IMAGE";case ".mp4"->"VIDEO";case ".wav",".mp3",".m4a"->"AUDIO";default->throw new BusinessException(415,"素材类型不受支持");};
        require(suppliedType==null||suppliedType.isBlank()||suppliedType.equals(type),422,"type 与文件不一致");
        require(!file.isEmpty(),422,"文件不能为空");
        require(file.getSize()<=(type.equals("VIDEO")?200L:20L)*1024*1024,413,"素材超过大小限制");
        String id=id("m"); Path original=root.resolve(id+ext); Path saved=original;
        try {
            file.transferTo(original);
            String metadata=probe(original,"stream=codec_type,codec_name,width,height:format=duration,format_name");
            Map<String,String> props=new HashMap<>();
            for(String line:metadata.split("\\R")) { int at=line.indexOf('='); if(at>0) props.put(line.substring(0,at),line.substring(at+1)); }
            int width=0,height=0,duration=0;
            String mime;
            if(type.equals("IMAGE")) {
                String codec=switch(ext) {case ".jpg",".jpeg"->"mjpeg";case ".png"->"png";default->"webp";};
                require(codec.equals(props.get("codec_name")),415,"实际图片格式与扩展名不一致");
                width=Integer.parseInt(props.getOrDefault("width","0"));height=Integer.parseInt(props.getOrDefault("height","0"));
                require(width>0&&height>0&&(long)width*height<=25000000,415,"图片像素超限");
                Path clean=root.resolve(id+"-clean.png");
                Process p=new ProcessBuilder("ffmpeg","-v","error","-protocol_whitelist","file,pipe","-i",original.toString(),"-frames:v","1","-map_metadata","-1",clean.toString())
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD).redirectError(ProcessBuilder.Redirect.DISCARD).start();
                if(!p.waitFor(20,TimeUnit.SECONDS)) { p.destroyForcibly(); throw new BusinessException(415,"图片处理超时"); }
                require(p.exitValue()==0,415,"无法处理图片");
                saved=clean;Files.delete(original);mime="image/png";
                require(Files.size(saved)<=20L*1024*1024,413,"处理后图片超限");
            } else {
                require(metadata.contains("codec_type="+(type.equals("VIDEO")?"video":"audio")),415,"素材内容与类型不一致");
                String format=props.getOrDefault("format_name","");
                require(switch(ext){case ".mp4",".m4a"->format.contains("mp4");case ".wav"->format.equals("wav");default->format.equals("mp3");},415,"容器与扩展名不一致");
                double seconds=Double.parseDouble(props.getOrDefault("duration","0"));
                require(Double.isFinite(seconds)&&seconds>0&&seconds<Integer.MAX_VALUE,415,"素材时长无效");
                duration=(int)Math.ceil(seconds);
                mime=switch(ext){case ".mp4"->"video/mp4";case ".m4a"->"audio/mp4";case ".wav"->"audio/wav";default->"audio/mpeg";};
            }
            Media m=new Media();m.setId(id);m.setUploaderId(owner);m.setUrl("/v1/media/"+id);m.setType(type);m.setWidth(width);m.setHeight(height);
            m.setDuration(duration);m.setSize(Files.size(saved));m.setCreateTime(now());m.setFilename(saved.getFileName().toString());m.setMime(mime);
            final Path stored=saved;
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) { if(status!=STATUS_COMMITTED) try { Files.deleteIfExists(stored); } catch(IOException ignored) {} }
            });
            media.insert(m);return view(m);
        } catch(InterruptedException e) { Thread.currentThread().interrupt();throw new BusinessException(503,"素材处理被中断"); }
        catch(IOException|NumberFormatException e) { throw new BusinessException(415,"素材无法解析"); }
        finally {
            if(media.selectById(id)==null) {
                try { Files.deleteIfExists(original);Files.deleteIfExists(root.resolve(id+"-clean.png")); } catch(IOException ignored) {}
            }
        }
    }
    public Media readable(String id,String user) {
        Media m=media.selectById(id);require(m!=null,404,"素材不存在");
        require(user.equals(m.getUploaderId())||capsuleMedia.selectCount(new QueryWrapper<CapsuleMedia>().eq("media_id",id))>0
            ||replyMedia.selectCount(new QueryWrapper<ReplyMedia>().eq("media_id",id))>0,403,"无权查看未发布素材");
        require(Files.isRegularFile(path(m)),404,"素材文件不存在");return m;
    }
    public Path path(Media m) {
        Path p=root.resolve(m.getFilename()).normalize();require(p.startsWith(root),404,"素材路径无效");return p;
    }
}
