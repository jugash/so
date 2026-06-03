package com.metalstack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metalstack.dto.*;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.QuestionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QuestionController.class)
@AutoConfigureMockMvc(addFilters = false) // Bypass Security filters for slice testing
public class QuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private QuestionService questionService;

    @MockBean
    private CurrentUser currentUser;

    private User user;
    private QuestionResponse questionResponse;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).username("testuser").build();
        questionResponse = QuestionResponse.builder()
                .id(100L)
                .title("Valid title length of question")
                .body("Valid body content which should be at least 20 chars long.")
                .author(UserSummary.builder().id(1L).username("testuser").build())
                .voteCount(0)
                .answerCount(0)
                .viewCount(0)
                .tags(Collections.emptySet())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getQuestions_Success() throws Exception {
        Page<QuestionResponse> page = new PageImpl<>(Collections.singletonList(questionResponse));
        when(currentUser.getIdOrNull()).thenReturn(1L);
        when(questionService.getQuestions(eq("newest"), eq("java"), any(PageRequest.class), eq(1L))).thenReturn(page);

        mockMvc.perform(get("/api/questions")
                        .param("sort", "newest")
                        .param("tag", "java")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(100L))
                .andExpect(jsonPath("$.content[0].title").value("Valid title length of question"));
    }

    @Test
    void getQuestion_Success() throws Exception {
        when(currentUser.getIdOrNull()).thenReturn(1L);
        when(questionService.getQuestion(100L, 1L)).thenReturn(questionResponse);

        mockMvc.perform(get("/api/questions/{id}", 100L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100L));
    }

    @Test
    void createQuestion_Success() throws Exception {
        QuestionRequest request = new QuestionRequest("Valid title length of question", "Valid body content which should be at least 20 chars long.", Set.of("java"));
        when(currentUser.get()).thenReturn(user);
        when(questionService.createQuestion(any(QuestionRequest.class), any(User.class))).thenReturn(questionResponse);

        mockMvc.perform(post("/api/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100L));
    }

    @Test
    void createQuestion_ValidationError() throws Exception {
        // Short title and body
        QuestionRequest request = new QuestionRequest("short", "short body", Set.of());

        mockMvc.perform(post("/api/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateQuestion_Success() throws Exception {
        QuestionRequest request = new QuestionRequest("Valid title length of question", "Valid body content which should be at least 20 chars long.", Set.of("java"));
        when(currentUser.get()).thenReturn(user);
        when(questionService.updateQuestion(anyLong(), any(QuestionRequest.class), any(User.class))).thenReturn(questionResponse);

        mockMvc.perform(put("/api/questions/{id}", 100L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteQuestion_Success() throws Exception {
        when(currentUser.get()).thenReturn(user);

        mockMvc.perform(delete("/api/questions/{id}", 100L))
                .andExpect(status().isNoContent());

        verify(questionService, times(1)).deleteQuestion(eq(100L), any(User.class));
    }

    @Test
    void acceptAnswer_Success() throws Exception {
        when(currentUser.get()).thenReturn(user);
        when(questionService.acceptAnswer(100L, 200L, user)).thenReturn(questionResponse);

        mockMvc.perform(post("/api/questions/{questionId}/accept/{answerId}", 100L, 200L))
                .andExpect(status().isOk());
    }

    @Test
    void closeQuestion_Success() throws Exception {
        mockMvc.perform(post("/api/questions/{id}/close", 100L))
                .andExpect(status().isOk());

        verify(questionService, times(1)).closeQuestion(100L);
    }
}
