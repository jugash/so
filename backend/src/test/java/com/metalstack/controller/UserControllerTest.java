package com.metalstack.controller;

import com.metalstack.dto.QuestionResponse;
import com.metalstack.dto.UserProfileResponse;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.QuestionService;
import com.metalstack.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private QuestionService questionService;

    @MockBean
    private CurrentUser currentUser;

    private User user;
    private UserProfileResponse profileResponse;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).username("testuser").build();
        profileResponse = UserProfileResponse.builder()
                .id(1L)
                .username("testuser")
                .displayName("Test User")
                .email("test@metalstack.dev")
                .reputation(100)
                .build();
    }

    @Test
    void getCurrentUser_Success() throws Exception {
        when(currentUser.get()).thenReturn(user);
        when(userService.getProfile(1L)).thenReturn(profileResponse);

        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    void updateNotifications_Success() throws Exception {
        when(currentUser.get()).thenReturn(user);

        mockMvc.perform(put("/api/users/me/notifications").param("enabled", "true"))
                .andExpect(status().isOk());

        verify(userService, times(1)).updateEmailNotifications(1L, true);
    }

    @Test
    void getUser_Success() throws Exception {
        when(userService.getProfile(1L)).thenReturn(profileResponse);

        mockMvc.perform(get("/api/users/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    void getUserQuestions_Success() throws Exception {
        Page<QuestionResponse> page = new PageImpl<>(Collections.emptyList());
        when(currentUser.getIdOrNull()).thenReturn(1L);
        when(questionService.getQuestionsByAuthor(eq(1L), any(PageRequest.class), eq(1L))).thenReturn(page);

        mockMvc.perform(get("/api/users/{id}/questions", 1L)
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk());
    }
}
