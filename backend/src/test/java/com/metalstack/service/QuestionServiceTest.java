package com.metalstack.service;

import com.metalstack.dto.*;
import com.metalstack.entity.*;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private VoteRepository voteRepository;
    @Mock
    private TagService tagService;

    @InjectMocks
    private QuestionService questionService;

    private User author;
    private User adminUser;
    private User regularUser;
    private Question question;
    private Tag javaTag;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).username("author").reputation(50).build();
        adminUser = User.builder().id(2L).username("admin").role("ADMIN").reputation(500).build();
        regularUser = User.builder().id(3L).username("regular").reputation(10).build();

        javaTag = Tag.builder().id(10L).name("java").questionCount(1).build();

        question = Question.builder()
                .id(100L)
                .title("Question Title")
                .body("Question Body")
                .author(author)
                .tags(new HashSet<>(Collections.singletonList(javaTag)))
                .voteCount(10)
                .answerCount(2)
                .viewCount(20)
                .isClosed(false)
                .answers(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getQuestions_WithTag() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Question> page = new PageImpl<>(Collections.singletonList(question));
        when(questionRepository.findByTagName("java", pageable)).thenReturn(page);
        when(commentRepository.findByQuestionIdOrderByCreatedAtAsc(100L)).thenReturn(Collections.emptyList());

        Page<QuestionResponse> result = questionService.getQuestions("newest", "java", pageable, 1L);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(100L, result.getContent().get(0).getId());
        verify(questionRepository, times(1)).findByTagName("java", pageable);
    }

    @Test
    void getQuestions_SortVotes() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Question> page = new PageImpl<>(Collections.singletonList(question));
        when(questionRepository.findAllByOrderByVoteCountDesc(pageable)).thenReturn(page);

        Page<QuestionResponse> result = questionService.getQuestions("votes", "", pageable, null);

        assertNotNull(result);
        verify(questionRepository, times(1)).findAllByOrderByVoteCountDesc(pageable);
    }

    @Test
    void getQuestions_SortUnanswered() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Question> page = new PageImpl<>(Collections.singletonList(question));
        when(questionRepository.findUnanswered(pageable)).thenReturn(page);

        Page<QuestionResponse> result = questionService.getQuestions("unanswered", null, pageable, null);

        assertNotNull(result);
        verify(questionRepository, times(1)).findUnanswered(pageable);
    }

    @Test
    void getQuestions_SortDefaultNewest() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Question> page = new PageImpl<>(Collections.singletonList(question));
        when(questionRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(page);

        Page<QuestionResponse> result = questionService.getQuestions("newest", null, pageable, null);

        assertNotNull(result);
        verify(questionRepository, times(1)).findAllByOrderByCreatedAtDesc(pageable);
    }

    @Test
    void getQuestion_Success() {
        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));
        when(commentRepository.findByQuestionIdOrderByCreatedAtAsc(100L)).thenReturn(Collections.emptyList());
        when(voteRepository.findByUserIdAndQuestionId(1L, 100L)).thenReturn(Optional.empty());

        QuestionResponse response = questionService.getQuestion(100L, 1L);

        assertNotNull(response);
        assertEquals(21, question.getViewCount()); // check view incremented
        verify(questionRepository, times(1)).save(question);
    }

    @Test
    void getQuestion_NotFound() {
        when(questionRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> questionService.getQuestion(999L, null));
    }

    @Test
    void createQuestion_Success() {
        QuestionRequest request = new QuestionRequest("New Question Title", "New Question Body", Set.of("java"));
        when(tagService.getOrCreateTags(request.getTags())).thenReturn(Set.of(javaTag));
        when(questionRepository.save(any(Question.class))).thenReturn(question);

        QuestionResponse response = questionService.createQuestion(request, author);

        assertNotNull(response);
        verify(tagService, times(1)).incrementQuestionCount(Set.of(javaTag));
        verify(questionRepository, times(1)).save(any(Question.class));
    }

    @Test
    void updateQuestion_Success() {
        QuestionRequest request = new QuestionRequest("Updated Title", "Updated Body", Set.of("java", "spring"));
        Tag springTag = Tag.builder().id(11L).name("spring").build();
        
        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));
        when(tagService.getOrCreateTags(request.getTags())).thenReturn(Set.of(javaTag, springTag));
        when(questionRepository.save(question)).thenReturn(question);

        QuestionResponse response = questionService.updateQuestion(100L, request, author);

        assertNotNull(response);
        assertEquals("Updated Title", question.getTitle());
        assertEquals("Updated Body", question.getBody());
        verify(tagService, times(1)).decrementQuestionCount(any());
        verify(tagService, times(1)).incrementQuestionCount(any());
    }

    @Test
    void updateQuestion_Unauthorized() {
        QuestionRequest request = new QuestionRequest("Updated Title", "Updated Body", Set.of("java"));
        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));

        assertThrows(IllegalArgumentException.class, () -> questionService.updateQuestion(100L, request, regularUser));
    }

    @Test
    void deleteQuestion_ByAuthor() {
        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));

        questionService.deleteQuestion(100L, author);

        verify(tagService, times(1)).decrementQuestionCount(question.getTags());
        verify(questionRepository, times(1)).delete(question);
    }

    @Test
    void deleteQuestion_ByAdmin() {
        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));

        questionService.deleteQuestion(100L, adminUser);

        verify(questionRepository, times(1)).delete(question);
    }

    @Test
    void deleteQuestion_Unauthorized() {
        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));

        assertThrows(IllegalArgumentException.class, () -> questionService.deleteQuestion(100L, regularUser));
    }

    @Test
    void closeQuestion_Success() {
        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));

        questionService.closeQuestion(100L);

        assertTrue(question.getIsClosed());
        verify(questionRepository, times(1)).save(question);
    }

    @Test
    void acceptAnswer_Success() {
        Answer answer1 = Answer.builder().id(200L).isAccepted(false).build();
        Answer answer2 = Answer.builder().id(201L).isAccepted(false).build();
        question.getAnswers().add(answer1);
        question.getAnswers().add(answer2);
        question.setAcceptedAnswerId(200L);
        answer1.setIsAccepted(true); // initially accepted 200

        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));

        // Accept 201
        questionService.acceptAnswer(100L, 201L, author);

        assertFalse(answer1.getIsAccepted());
        assertTrue(answer2.getIsAccepted());
        assertEquals(201L, question.getAcceptedAnswerId());
        verify(questionRepository, times(1)).save(question);
    }

    @Test
    void acceptAnswer_Unauthorized() {
        when(questionRepository.findById(100L)).thenReturn(Optional.of(question));

        assertThrows(IllegalArgumentException.class, () -> questionService.acceptAnswer(100L, 200L, regularUser));
    }

    @Test
    void searchQuestions_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Question> page = new PageImpl<>(Collections.singletonList(question));
        when(questionRepository.searchFullText("java", pageable)).thenReturn(page);

        Page<QuestionResponse> result = questionService.searchQuestions("java", pageable, null);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(questionRepository, times(1)).searchFullText("java", pageable);
    }

    @Test
    void getQuestionsByAuthor_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Question> page = new PageImpl<>(Collections.singletonList(question));
        when(questionRepository.findByAuthorIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);

        Page<QuestionResponse> result = questionService.getQuestionsByAuthor(1L, pageable, null);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(questionRepository, times(1)).findByAuthorIdOrderByCreatedAtDesc(1L, pageable);
    }
}
