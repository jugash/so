package com.metalstack.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class VoteRequest {

    private Long questionId;
    private Long answerId;

    @NotNull(message = "Vote value is required")
    private Short value; // +1 or -1
}
