package com.metalstack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metalstack.dto.*;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.AnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnswerController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AnswerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnswerService answerService;

    @MockBean
    private CurrentUser currentUser;

    private User user;
    private AnswerResponse answerResponse;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).username("testuser").build();
        answerResponse = AnswerResponse.builder()
                .id(100L)
                .body("Valid body content which should be at least 20 chars long.")
                .author(UserSummary.builder().id(1L).username("testuser").build())
                .voteCount(0)
                .isAccepted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getAnswers_Success() throws Exception {
        when(currentUser.getIdOrNull()).thenReturn(1L);
        when(answerService.getAnswers(10L, 1L)).thenReturn(Collections.singletonList(answerResponse));

        mockMvc.perform(get("/api/questions/{questionId}/answers", 10L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100L));
    }

    @Test
    void createAnswer_Success() throws Exception {
        AnswerRequest request = new AnswerRequest("Valid body content which should be at least 20 chars long.");
        when(currentUser.get()).thenReturn(user);
        when(answerService.createAnswer(eq(10L), any(AnswerRequest.class), any(User.class))).thenReturn(answerResponse);

        mockMvc.perform(post("/api/questions/{questionId}/answers", 10L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100L));
    }

    @Test
    void createAnswer_ValidationError() throws Exception {
        AnswerRequest request = new AnswerRequest("short");

        mockMvc.perform(post("/api/questions/{questionId}/answers", 10L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
