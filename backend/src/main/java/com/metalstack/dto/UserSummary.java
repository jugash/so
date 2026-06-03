package com.metalstack.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserSummary {
    private Long id;
    private String username;
    private String displayName;
    private int reputation;
}
