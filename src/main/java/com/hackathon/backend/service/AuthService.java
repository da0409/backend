package com.hackathon.backend.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.hackathon.backend.mapper.*;
import com.hackathon.backend.pojo.entity.*;
import com.hackathon.backend.pojo.dto.Requests;
import com.hackathon.backend.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import static com.hackathon.backend.common.Support.*;
import static com.hackathon.backend.common.BusinessException.require;

@Service
public class AuthService {
    private final UserMapper users;
    private final AuthSessionMapper sessions;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
    private final String dummy = encoder.encode(UUID.randomUUID().toString());
    public AuthService(UserMapper users, AuthSessionMapper sessions) { this.users=users; this.sessions=sessions; }
    public static String hash(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public Map<String,Object> view(User u) { return map("userId",u.getId(),"username",u.getUsername(),"nickname",u.getNickname()); }
    @Transactional
    public Map<String,Object> register(Requests.Register body) {
        require(body.password().getBytes(StandardCharsets.UTF_8).length<=72,422,"密码 UTF-8 长度不能超过 72 字节");
        require(users.selectCount(new QueryWrapper<User>().eq("username",body.username()))==0,409,"用户名已存在");
        User u=new User(); u.setId(id("u")); u.setUsername(body.username()); u.setNickname(body.nickname());
        u.setPassword(encoder.encode(body.password())); u.setCreateTime(now()); u.setUpdateTime(now()); users.insert(u);
        return issue(u);
    }
    @Transactional
    public Map<String,Object> login(Requests.Login body) {
        require(body.password().getBytes(StandardCharsets.UTF_8).length<=72,422,"密码 UTF-8 长度不能超过 72 字节");
        User u=users.selectOne(new QueryWrapper<User>().eq("username",body.username()));
        boolean match=encoder.matches(body.password(),u==null?dummy:u.getPassword());
        require(u!=null&&match,401,"用户名或密码错误");
        return issue(u);
    }
    private Map<String,Object> issue(User u) {
        byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        AuthSession session=new AuthSession(); session.setId(hash(token)); session.setUserId(u.getId()); session.setExpiresAt(now().plusHours(24));
        sessions.insert(session);
        return map("token",token,"tokenType","Bearer","expiresIn",86400,"user",view(u));
    }
    public User authenticate(String header) {
        require(header!=null&&header.startsWith("Bearer ")&&header.length()<200,401,"请先登录");
        AuthSession session=sessions.selectById(hash(header.substring(7)));
        require(session!=null&&session.getExpiresAt().isAfter(now()),401,"令牌无效或已过期");
        User u=users.selectById(session.getUserId()); require(u!=null,401,"用户不存在"); return u;
    }
    @Transactional
    public void logout(String header) { sessions.deleteById(hash(header.substring(7))); }
}
