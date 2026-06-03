package com.metalstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnswerRequest {

    @NotBlank(message = "Answer body is required")
    @Size(min = 20, message = "Answer must be at least 20 characters")
    private String body;
}
