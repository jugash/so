package com.metalstack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metalstack.dto.*;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.CommentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CommentService commentService;

    @MockBean
    private CurrentUser currentUser;

    private User user;
    private CommentResponse commentResponse;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).username("testuser").build();
        commentResponse = CommentResponse.builder()
                .id(100L)
                .body("Valid body content of comment.")
                .author(UserSummary.builder().id(1L).username("testuser").build())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void addCommentToQuestion_Success() throws Exception {
        CommentRequest request = new CommentRequest("Valid body content of comment.");
        when(currentUser.get()).thenReturn(user);
        when(commentService.addCommentToQuestion(eq(10L), any(CommentRequest.class), any(User.class))).thenReturn(commentResponse);

        mockMvc.perform(post("/api/questions/{id}/comments", 10L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100L));
    }

    @Test
    void addCommentToAnswer_Success() throws Exception {
        CommentRequest request = new CommentRequest("Valid body content of comment.");
        when(currentUser.get()).thenReturn(user);
        when(commentService.addCommentToAnswer(eq(20L), any(CommentRequest.class), any(User.class))).thenReturn(commentResponse);

        mockMvc.perform(post("/api/answers/{id}/comments", 20L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100L));
    }

    @Test
    void addComment_ValidationError() throws Exception {
        CommentRequest request = new CommentRequest(""); // empty body

        mockMvc.perform(post("/api/questions/{id}/comments", 10L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
