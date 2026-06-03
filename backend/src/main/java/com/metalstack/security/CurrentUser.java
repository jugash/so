package com.metalstack.security;

import com.metalstack.entity.User;
import com.metalstack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Map;

/**
 * Utility to resolve the current authenticated user from the SecurityContext.
 * Auto-provisions a local User record on first access using Keycloak JWT claims.
 */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository userRepository;

    /**
     * Get the current user, creating a local record if this is their first request.
     */
    @Transactional
    public User get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth instanceof JwtAuthenticationToken jwtAuth)) {
            throw new IllegalStateException("No authenticated user");
        }

        Jwt jwt = jwtAuth.getToken();
        String keycloakId = jwt.getSubject();
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");
        String rawDisplayName = jwt.getClaimAsString("name");
        final String displayName = (rawDisplayName == null || rawDisplayName.isBlank()) ? username : rawDisplayName;

        // Find by keycloak_id or auto-provision
        return userRepository.findByKeycloakId(keycloakId)
                .orElseGet(() -> {
                    String role = extractTopRole(jwt);
                    User user = User.builder()
                            .keycloakId(keycloakId)
                            .username(username)
                            .displayName(displayName)
                            .email(email != null ? email : username + "@internal.dev")
                            .role(role)
                            .build();
                    return userRepository.save(user);
                });
    }

    /**
     * Get the current user's ID, or null if not authenticated.
     */
    public Long getIdOrNull() {
        try {
            return get().getId();
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String extractTopRole(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) return "USER";

        Object rolesObj = realmAccess.get("roles");
        if (!(rolesObj instanceof Collection<?> roles)) return "USER";

        if (roles.stream().anyMatch("ADMIN"::equals)) return "ADMIN";
        if (roles.stream().anyMatch("MODERATOR"::equals)) return "MODERATOR";
        return "USER";
    }
}
