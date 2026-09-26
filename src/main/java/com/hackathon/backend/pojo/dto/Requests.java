package com.hackathon.backend.pojo.dto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public final class Requests {
    private Requests() {}
    public record Register(@NotBlank @Pattern(regexp="[a-zA-Z0-9_]{3,64}") String username,
                           @NotBlank @Size(min=8,max=64) String password, @NotBlank @Size(max=64) String nickname) {}
    public record Login(@NotBlank @Size(max=64) String username, @NotBlank @Size(max=64) String password) {}
    public record MediaRef(@NotBlank @Size(max=32) String mediaId, @Size(max=255) String caption, String type) {}
    public record CapsuleCreate(@NotBlank @Size(max=128) String title, @NotBlank @Size(max=512) String question,
          @NotBlank @Size(max=32) String poiId, @Size(max=128) String poiName,
          @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
          @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
          @Size(max=16) String cityCode, @Size(max=64) String cityName,
          @NotNull @Size(min=1,max=10) List<@Valid MediaRef> mediaList,
          @NotNull LocalDate answerBeginTime, @NotNull LocalDate answerEndTime, Boolean blurFace) {}
    public record CapsuleUpdate(@NotBlank @Size(max=32) String capsuleId,
          @Size(min=1,max=128) String title,@Size(min=1,max=512) String question,
          @Size(max=32) String poiId,@Size(max=128) String poiName,
          @Size(min=1,max=10) List<@Valid MediaRef> mediaList,
          LocalDate answerBeginTime,LocalDate answerEndTime,Boolean blurFace) {}
    public record Checkin(@NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
                          @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat) {}
    public record ReplyCreate(@Size(max=5000) String content, @Size(max=10) List<@Valid MediaRef> mediaList,
                              Boolean blurFace, Boolean onSiteDeclaration) {}
}
