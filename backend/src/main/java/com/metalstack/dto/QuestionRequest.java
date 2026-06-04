package com.metalstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.Set;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class QuestionRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 10, max = 300, message = "Title must be between 10 and 300 characters")
    private String title;

    @NotBlank(message = "Body is required")
    @Size(min = 20, message = "Body must be at least 20 characters")
    private String body;

    private Set<String> tags;

    private Long directedToUserId;
}
