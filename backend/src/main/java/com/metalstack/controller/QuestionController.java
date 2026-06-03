package com.metalstack.controller;

import com.metalstack.dto.QuestionRequest;
import com.metalstack.dto.QuestionResponse;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<Page<QuestionResponse>> getQuestions(
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long userId = currentUser.getIdOrNull();
        return ResponseEntity.ok(questionService.getQuestions(sort, tag, PageRequest.of(page, size), userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponse> getQuestion(@PathVariable Long id) {
        Long userId = currentUser.getIdOrNull();
        return ResponseEntity.ok(questionService.getQuestion(id, userId));
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> createQuestion(@Valid @RequestBody QuestionRequest request) {
        User user = currentUser.get();
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestion(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable Long id, @Valid @RequestBody QuestionRequest request) {
        User user = currentUser.get();
        return ResponseEntity.ok(questionService.updateQuestion(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        User user = currentUser.get();
        // Admins can delete any question, regular users only their own
        questionService.deleteQuestion(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{questionId}/accept/{answerId}")
    public ResponseEntity<QuestionResponse> acceptAnswer(
            @PathVariable Long questionId, @PathVariable Long answerId) {
        User user = currentUser.get();
        return ResponseEntity.ok(questionService.acceptAnswer(questionId, answerId, user));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Void> closeQuestion(@PathVariable Long id) {
        questionService.closeQuestion(id);
        return ResponseEntity.ok().build();
    }
}
