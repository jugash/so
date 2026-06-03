package com.metalstack.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class KeycloakJwtConverterTest {

    private final KeycloakJwtConverter converter = new KeycloakJwtConverter();

    @Test
    void convert_WithRealmAccessRoles_ConvertsToAuthorities() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("preferred_username")).thenReturn("bob");
        
        when(jwt.getClaim("scope")).thenReturn(null);
        when(jwt.getClaim("scp")).thenReturn(null);

        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.of("admin", "user", 123));
        when(jwt.getClaimAsMap("realm_access")).thenReturn(realmAccess);

        AbstractAuthenticationToken result = converter.convert(jwt);
        assertNotNull(result);
        assertEquals("bob", result.getName());
        
        Collection<GrantedAuthority> authorities = result.getAuthorities();
        assertEquals(2, authorities.size());
        
        List<String> authorityNames = authorities.stream().map(GrantedAuthority::getAuthority).toList();
        assertTrue(authorityNames.contains("ROLE_ADMIN"));
        assertTrue(authorityNames.contains("ROLE_USER"));
        assertFalse(authorityNames.contains("ROLE_123"));
    }

    @Test
    void convert_RealmAccessNull_NoKeycloakAuthorities() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("preferred_username")).thenReturn("bob");
        when(jwt.getClaimAsMap("realm_access")).thenReturn(null);

        AbstractAuthenticationToken result = converter.convert(jwt);
        assertNotNull(result);
        assertTrue(result.getAuthorities().isEmpty());
    }

    @Test
    void convert_RolesNotCollection_NoKeycloakAuthorities() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("preferred_username")).thenReturn("bob");
        
        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", "NOT_A_COLLECTION");
        when(jwt.getClaimAsMap("realm_access")).thenReturn(realmAccess);

        AbstractAuthenticationToken result = converter.convert(jwt);
        assertNotNull(result);
        assertTrue(result.getAuthorities().isEmpty());
    }
}
