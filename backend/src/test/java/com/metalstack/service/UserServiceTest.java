package com.metalstack.service;

import com.metalstack.dto.UserProfileResponse;
import com.metalstack.dto.UserSummary;
import com.metalstack.entity.User;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .username("testuser")
                .displayName("Test User")
                .email("test@metalstack.dev")
                .about("Hello bio")
                .reputation(100)
                .emailNotifications(true)
                .questions(new HashSet<>())
                .answers(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserProfileResponse response = userService.getProfile(1L);

        assertNotNull(response);
        assertEquals(user.getId(), response.getId());
        assertEquals(user.getUsername(), response.getUsername());
        assertEquals(user.getDisplayName(), response.getDisplayName());
        assertEquals(user.getEmail(), response.getEmail());
        assertEquals(user.getAbout(), response.getAbout());
        assertEquals(user.getReputation(), response.getReputation());
        assertEquals(0, response.getQuestionCount());
        assertEquals(0, response.getAnswerCount());
        assertTrue(response.isEmailNotifications());
        assertEquals(user.getCreatedAt(), response.getCreatedAt());
    }

    @Test
    void getProfile_UserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getProfile(99L));
    }

    @Test
    void updateEmailNotifications_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        userService.updateEmailNotifications(1L, false);

        assertFalse(user.getEmailNotifications());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void updateEmailNotifications_UserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.updateEmailNotifications(99L, false));
    }

    @Test
    void findByUsername_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        User result = userService.findByUsername("testuser");

        assertNotNull(result);
        assertEquals(user.getUsername(), result.getUsername());
    }

    @Test
    void findByUsername_NotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.findByUsername("unknown"));
    }

    @Test
    void toUserSummary_Success() {
        UserSummary summary = UserService.toUserSummary(user);

        assertNotNull(summary);
        assertEquals(user.getId(), summary.getId());
        assertEquals(user.getUsername(), summary.getUsername());
        assertEquals(user.getDisplayName(), summary.getDisplayName());
        assertEquals(user.getReputation(), summary.getReputation());
    }
}
