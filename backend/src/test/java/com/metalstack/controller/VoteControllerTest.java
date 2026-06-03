package com.metalstack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metalstack.dto.VoteRequest;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.VoteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VoteController.class)
@AutoConfigureMockMvc(addFilters = false)
public class VoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VoteService voteService;

    @MockBean
    private CurrentUser currentUser;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).username("testuser").build();
    }

    @Test
    void vote_Success() throws Exception {
        VoteRequest request = new VoteRequest(10L, null, (short) 1);
        when(currentUser.get()).thenReturn(user);

        mockMvc.perform(post("/api/votes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(voteService, times(1)).vote(any(VoteRequest.class), eq(user));
    }

    @Test
    void vote_ValidationError() throws Exception {
        // Value out of bounds
        VoteRequest request = new VoteRequest(10L, null, (short) 0);
        when(currentUser.get()).thenReturn(user);
        doThrow(new IllegalArgumentException("Vote value must be +1 or -1"))
                .when(voteService).vote(any(VoteRequest.class), any(User.class));

        mockMvc.perform(post("/api/votes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
