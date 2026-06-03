package com.metalstack.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserProfileResponse {
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String about;
    private int reputation;
    private long questionCount;
    private long answerCount;
    private boolean emailNotifications;
    private LocalDateTime createdAt;
}
