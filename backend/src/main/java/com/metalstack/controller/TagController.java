package com.metalstack.controller;

import com.metalstack.dto.QuestionResponse;
import com.metalstack.dto.TagResponse;
import com.metalstack.security.CurrentUser;
import com.metalstack.service.QuestionService;
import com.metalstack.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;
    private final QuestionService questionService;
    private final CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<List<TagResponse>> getAllTags() {
        return ResponseEntity.ok(tagService.getAllTags());
    }

    @GetMapping("/search")
    public ResponseEntity<List<TagResponse>> searchTags(@RequestParam String q) {
        return ResponseEntity.ok(tagService.searchTags(q));
    }

    @GetMapping("/{name}/questions")
    public ResponseEntity<Page<QuestionResponse>> getQuestionsByTag(
            @PathVariable String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = currentUser.getIdOrNull();
        return ResponseEntity.ok(questionService.getQuestions("newest", name, PageRequest.of(page, size), userId));
    }
}
