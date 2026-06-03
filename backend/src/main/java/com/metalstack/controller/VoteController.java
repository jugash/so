package com.metalstack.controller;

import com.metalstack.dto.VoteRequest;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;
    private final CurrentUser currentUser;

    @PostMapping
    public ResponseEntity<Void> vote(@Valid @RequestBody VoteRequest request) {
        User user = currentUser.get();
        voteService.vote(request, user);
        return ResponseEntity.ok().build();
    }
}
