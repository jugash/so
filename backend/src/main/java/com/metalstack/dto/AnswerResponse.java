package com.metalstack.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnswerResponse {
    private Long id;
    private String body;
    private UserSummary author;
    private int voteCount;
    private boolean isAccepted;
    private List<CommentResponse> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer userVote;
}
