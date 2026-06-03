package com.metalstack.service;

import com.metalstack.dto.TagResponse;
import com.metalstack.entity.Tag;
import com.metalstack.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    public List<TagResponse> getAllTags() {
        return tagRepository.findAllOrderByQuestionCountDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<TagResponse> searchTags(String prefix) {
        return tagRepository.findByNameStartingWith(prefix).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public Set<Tag> getOrCreateTags(Set<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return Set.of();
        }
        return tagNames.stream()
                .map(String::toLowerCase)
                .map(name -> tagRepository.findByName(name)
                        .orElseGet(() -> tagRepository.save(Tag.builder().name(name).build())))
                .collect(Collectors.toSet());
    }

    @Transactional
    public void incrementQuestionCount(Set<Tag> tags) {
        tags.forEach(tag -> {
            tag.setQuestionCount(tag.getQuestionCount() + 1);
            tagRepository.save(tag);
        });
    }

    @Transactional
    public void decrementQuestionCount(Set<Tag> tags) {
        tags.forEach(tag -> {
            tag.setQuestionCount(Math.max(0, tag.getQuestionCount() - 1));
            tagRepository.save(tag);
        });
    }

    public TagResponse toResponse(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .description(tag.getDescription())
                .questionCount(tag.getQuestionCount())
                .build();
    }
}
