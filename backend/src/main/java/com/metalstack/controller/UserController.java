package com.metalstack.controller;

import com.metalstack.dto.QuestionResponse;
import com.metalstack.dto.UserProfileResponse;
import com.metalstack.entity.User;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.QuestionService;
import com.metalstack.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final QuestionService questionService;
    private final CurrentUser currentUser;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        User user = currentUser.get();
        return ResponseEntity.ok(userService.getProfile(user.getId()));
    }

    @PutMapping("/me/notifications")
    public ResponseEntity<Void> updateNotifications(@RequestParam boolean enabled) {
        User user = currentUser.get();
        userService.updateEmailNotifications(user.getId(), enabled);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<Page<QuestionResponse>> getUserQuestions(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = currentUser.getIdOrNull();
        return ResponseEntity.ok(questionService.getQuestionsByAuthor(id, PageRequest.of(page, size), userId));
    }
}
