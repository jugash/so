package com.metalstack.controller;

import com.metalstack.dto.*;
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
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SearchController.class)
@AutoConfigureMockMvc(addFilters = false)
public class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private QuestionService questionService;

    @MockBean
    private CurrentUser currentUser;

    private QuestionResponse questionResponse;

    @BeforeEach
    void setUp() {
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
    void search_Success() throws Exception {
        Page<QuestionResponse> page = new PageImpl<>(Collections.singletonList(questionResponse));
        when(currentUser.getIdOrNull()).thenReturn(1L);
        when(questionService.searchQuestions(eq("spring"), any(PageRequest.class), eq(1L))).thenReturn(page);

        mockMvc.perform(get("/api/search")
                        .param("q", "spring")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(100L));
    }
}
