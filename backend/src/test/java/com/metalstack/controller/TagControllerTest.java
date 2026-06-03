package com.metalstack.controller;

import com.metalstack.dto.QuestionResponse;
import com.metalstack.dto.TagResponse;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.QuestionService;
import com.metalstack.service.TagService;
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

@WebMvcTest(TagController.class)
@AutoConfigureMockMvc(addFilters = false)
public class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TagService tagService;

    @MockBean
    private QuestionService questionService;

    @MockBean
    private CurrentUser currentUser;

    private TagResponse tagResponse;

    @BeforeEach
    void setUp() {
        tagResponse = TagResponse.builder().id(10L).name("java").questionCount(5).build();
    }

    @Test
    void getAllTags_Success() throws Exception {
        when(tagService.getAllTags()).thenReturn(Collections.singletonList(tagResponse));

        mockMvc.perform(get("/api/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("java"));
    }

    @Test
    void searchTags_Success() throws Exception {
        when(tagService.searchTags("ja")).thenReturn(Collections.singletonList(tagResponse));

        mockMvc.perform(get("/api/tags/search").param("q", "ja"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("java"));
    }

    @Test
    void getQuestionsByTag_Success() throws Exception {
        Page<QuestionResponse> page = new PageImpl<>(Collections.emptyList());
        when(currentUser.getIdOrNull()).thenReturn(1L);
        when(questionService.getQuestions(eq("newest"), eq("java"), any(PageRequest.class), eq(1L))).thenReturn(page);

        mockMvc.perform(get("/api/tags/{name}/questions", "java")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk());
    }
}
