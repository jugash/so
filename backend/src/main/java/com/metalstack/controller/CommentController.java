package com.metalstack.controller;

import com.metalstack.dto.CommentRequest;
import com.metalstack.dto.CommentResponse;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final CurrentUser currentUser;

    @PostMapping("/questions/{questionId}/comments")
    public ResponseEntity<CommentResponse> addQuestionComment(
            @PathVariable Long questionId, @Valid @RequestBody CommentRequest request) {
        User user = currentUser.get();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addCommentToQuestion(questionId, request, user));
    }

    @PostMapping("/answers/{answerId}/comments")
    public ResponseEntity<CommentResponse> addAnswerComment(
            @PathVariable Long answerId, @Valid @RequestBody CommentRequest request) {
        User user = currentUser.get();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addCommentToAnswer(answerId, request, user));
    }
}
