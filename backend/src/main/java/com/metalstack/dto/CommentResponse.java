package com.metalstack.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CommentResponse {
    private Long id;
    private String body;
    private UserSummary author;
    private LocalDateTime createdAt;
    private int likeCount;
    private boolean likedByCurrentUser;
}
