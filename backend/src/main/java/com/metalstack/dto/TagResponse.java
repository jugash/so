package com.metalstack.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TagResponse {
    private Long id;
    private String name;
    private String description;
    private int questionCount;
}
