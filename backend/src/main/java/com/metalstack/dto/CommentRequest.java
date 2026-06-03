package com.metalstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CommentRequest {

    @NotBlank(message = "Comment body is required")
    @Size(max = 600, message = "Comment must be at most 600 characters")
    private String body;
}
