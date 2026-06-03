package com.metalstack.security;

import com.metalstack.entity.User;
import com.metalstack.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CurrentUserTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CurrentUser currentUser;

    private SecurityContext originalContext;

    @BeforeEach
    void setUp() {
        originalContext = SecurityContextHolder.getContext();
        SecurityContextHolder.setContext(SecurityContextHolder.createEmptyContext());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.setContext(originalContext);
    }

    @Test
    void get_NoAuthentication_ThrowsException() {
        assertThrows(IllegalStateException.class, () -> currentUser.get());
    }

    @Test
    void get_NonJwtAuthentication_ThrowsException() {
        SecurityContextHolder.getContext().setAuthentication(mock(org.springframework.security.core.Authentication.class));
        assertThrows(IllegalStateException.class, () -> currentUser.get());
    }

    @Test
    void get_UserExists_ReturnsUser() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("keycloak-id-123");
        when(jwt.getClaimAsString("preferred_username")).thenReturn("alice");
        when(jwt.getClaimAsString("email")).thenReturn("alice@example.com");
        when(jwt.getClaimAsString("name")).thenReturn("Alice Smith");

        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, List.of(), "alice");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User existingUser = User.builder().id(1L).keycloakId("keycloak-id-123").username("alice").build();
        when(userRepository.findByKeycloakId("keycloak-id-123")).thenReturn(Optional.of(existingUser));

        User result = currentUser.get();
        assertEquals(existingUser, result);
        verify(userRepository, never()).save(any());
    }

    @Test
    void get_UserDoesNotExist_AutoProvisionsUserWithAdminRole() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("keycloak-id-123");
        when(jwt.getClaimAsString("preferred_username")).thenReturn("alice");
        when(jwt.getClaimAsString("email")).thenReturn("alice@example.com");
        when(jwt.getClaimAsString("name")).thenReturn("Alice Smith");

        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.of("ADMIN", "USER"));
        when(jwt.getClaimAsMap("realm_access")).thenReturn(realmAccess);

        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, List.of(), "alice");
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findByKeycloakId("keycloak-id-123")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = currentUser.get();
        assertNotNull(result);
        assertEquals("keycloak-id-123", result.getKeycloakId());
        assertEquals("alice", result.getUsername());
        assertEquals("Alice Smith", result.getDisplayName());
        assertEquals("alice@example.com", result.getEmail());
        assertEquals("ADMIN", result.getRole());
    }

    @Test
    void get_UserDoesNotExist_AutoProvisionsUserWithModeratorRole() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("keycloak-id-123");
        when(jwt.getClaimAsString("preferred_username")).thenReturn("alice");
        when(jwt.getClaimAsString("email")).thenReturn(null);
        when(jwt.getClaimAsString("name")).thenReturn("");

        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.of("MODERATOR"));
        when(jwt.getClaimAsMap("realm_access")).thenReturn(realmAccess);

        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, List.of(), "alice");
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findByKeycloakId("keycloak-id-123")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = currentUser.get();
        assertNotNull(result);
        assertEquals("MODERATOR", result.getRole());
        assertEquals("alice@internal.dev", result.getEmail());
        assertEquals("alice", result.getDisplayName());
    }

    @Test
    void get_UserDoesNotExist_RealmAccessNull_FallbackToUserRole() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("keycloak-id-123");
        when(jwt.getClaimAsString("preferred_username")).thenReturn("alice");
        when(jwt.getClaimAsString("email")).thenReturn("alice@example.com");
        when(jwt.getClaimAsString("name")).thenReturn("Alice");
        when(jwt.getClaimAsMap("realm_access")).thenReturn(null);

        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, List.of(), "alice");
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findByKeycloakId("keycloak-id-123")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = currentUser.get();
        assertNotNull(result);
        assertEquals("USER", result.getRole());
    }

    @Test
    void get_UserDoesNotExist_RolesNotCollection_FallbackToUserRole() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("keycloak-id-123");
        when(jwt.getClaimAsString("preferred_username")).thenReturn("alice");
        when(jwt.getClaimAsString("email")).thenReturn("alice@example.com");
        when(jwt.getClaimAsString("name")).thenReturn("Alice");

        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", "NOT_A_COLLECTION");
        when(jwt.getClaimAsMap("realm_access")).thenReturn(realmAccess);

        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, List.of(), "alice");
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findByKeycloakId("keycloak-id-123")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = currentUser.get();
        assertNotNull(result);
        assertEquals("USER", result.getRole());
    }

    @Test
    void getIdOrNull_Authenticated_ReturnsId() {
        CurrentUser spyCurrentUser = spy(currentUser);
        User user = User.builder().id(42L).build();
        doReturn(user).when(spyCurrentUser).get();

        assertEquals(42L, spyCurrentUser.getIdOrNull());
    }

    @Test
    void getIdOrNull_ExceptionThrown_ReturnsNull() {
        CurrentUser spyCurrentUser = spy(currentUser);
        doThrow(new IllegalStateException("No auth")).when(spyCurrentUser).get();

        assertNull(spyCurrentUser.getIdOrNull());
    }
}
