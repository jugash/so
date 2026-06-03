package com.metalstack.controller;

import com.metalstack.dto.AnswerRequest;
import com.metalstack.dto.AnswerResponse;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.AnswerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions/{questionId}/answers")
@RequiredArgsConstructor
public class AnswerController {

    private final AnswerService answerService;
    private final CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<List<AnswerResponse>> getAnswers(@PathVariable Long questionId) {
        Long userId = currentUser.getIdOrNull();
        return ResponseEntity.ok(answerService.getAnswers(questionId, userId));
    }

    @PostMapping
    public ResponseEntity<AnswerResponse> createAnswer(
            @PathVariable Long questionId, @Valid @RequestBody AnswerRequest request) {
        User user = currentUser.get();
        return ResponseEntity.status(HttpStatus.CREATED).body(answerService.createAnswer(questionId, request, user));
    }
}
