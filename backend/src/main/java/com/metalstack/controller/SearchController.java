package com.metalstack.controller;

import com.metalstack.dto.QuestionResponse;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final QuestionService questionService;
    private final CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<Page<QuestionResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = currentUser.getIdOrNull();
        return ResponseEntity.ok(questionService.searchQuestions(q, PageRequest.of(page, size), userId));
    }
}
