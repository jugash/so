package com.metalstack.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class QuestionResponse {
    private Long id;
    private String title;
    private String body;
    private UserSummary author;
    private int voteCount;
    private int answerCount;
    private int viewCount;
    private boolean isClosed;
    private Long acceptedAnswerId;
    private Set<TagResponse> tags;
    private List<CommentResponse> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer userVote; // +1, -1, or null
}
