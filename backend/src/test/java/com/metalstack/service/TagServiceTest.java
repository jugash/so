package com.metalstack.service;

import com.metalstack.dto.TagResponse;
import com.metalstack.entity.Tag;
import com.metalstack.repository.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TagService tagService;

    private Tag springBootTag;
    private Tag reactTag;

    @BeforeEach
    void setUp() {
        springBootTag = Tag.builder()
                .id(1L)
                .name("spring-boot")
                .description("Java framework")
                .questionCount(5)
                .build();

        reactTag = Tag.builder()
                .id(2L)
                .name("react")
                .description("JS library")
                .questionCount(3)
                .build();
    }

    @Test
    void getAllTags_Success() {
        when(tagRepository.findAllOrderByQuestionCountDesc()).thenReturn(Arrays.asList(springBootTag, reactTag));

        List<TagResponse> responses = tagService.getAllTags();

        assertNotNull(responses);
        assertEquals(2, responses.size());
        assertEquals("spring-boot", responses.get(0).getName());
        assertEquals("react", responses.get(1).getName());
    }

    @Test
    void searchTags_Success() {
        when(tagRepository.findByNameStartingWith("sp")).thenReturn(Collections.singletonList(springBootTag));

        List<TagResponse> responses = tagService.searchTags("sp");

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("spring-boot", responses.get(0).getName());
    }

    @Test
    void getOrCreateTags_NullOrEmpty() {
        assertTrue(tagService.getOrCreateTags(null).isEmpty());
        assertTrue(tagService.getOrCreateTags(new HashSet<>()).isEmpty());
    }

    @Test
    void getOrCreateTags_MixedExistingAndNew() {
        Set<String> tagNames = new HashSet<>(Arrays.asList("spring-boot", "new-tag"));
        
        when(tagRepository.findByName("spring-boot")).thenReturn(Optional.of(springBootTag));
        when(tagRepository.findByName("new-tag")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(invocation -> {
            Tag tag = invocation.getArgument(0);
            tag.setId(99L);
            return tag;
        });

        Set<Tag> result = tagService.getOrCreateTags(tagNames);

        assertNotNull(result);
        assertEquals(2, result.size());
        
        boolean foundSpringBoot = false;
        boolean foundNewTag = false;
        for (Tag tag : result) {
            if ("spring-boot".equals(tag.getName())) {
                foundSpringBoot = true;
                assertEquals(1L, tag.getId());
            } else if ("new-tag".equals(tag.getName())) {
                foundNewTag = true;
                assertEquals(99L, tag.getId());
            }
        }
        assertTrue(foundSpringBoot);
        assertTrue(foundNewTag);
    }

    @Test
    void incrementQuestionCount_Success() {
        Set<Tag> tags = new HashSet<>(Arrays.asList(springBootTag, reactTag));

        tagService.incrementQuestionCount(tags);

        assertEquals(6, springBootTag.getQuestionCount());
        assertEquals(4, reactTag.getQuestionCount());
        verify(tagRepository, times(1)).save(springBootTag);
        verify(tagRepository, times(1)).save(reactTag);
    }

    @Test
    void decrementQuestionCount_Success() {
        springBootTag.setQuestionCount(0); // Test Math.max edge case
        Set<Tag> tags = new HashSet<>(Arrays.asList(springBootTag, reactTag));

        tagService.decrementQuestionCount(tags);

        assertEquals(0, springBootTag.getQuestionCount());
        assertEquals(2, reactTag.getQuestionCount());
        verify(tagRepository, times(1)).save(springBootTag);
        verify(tagRepository, times(1)).save(reactTag);
    }
}
