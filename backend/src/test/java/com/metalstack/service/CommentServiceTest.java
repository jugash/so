package com.metalstack.service;

import com.metalstack.dto.CommentRequest;
import com.metalstack.dto.CommentResponse;
import com.metalstack.entity.*;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private AnswerRepository answerRepository;

    @InjectMocks
    private CommentService commentService;

    private User author;
    private Question question;
    private Answer answer;
    private CommentRequest commentRequest;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).username("commenter").displayName("Commenter").reputation(10).build();
        question = Question.builder().id(10L).title("Test Q").body("Body Q").author(author).build();
        answer = Answer.builder().id(20L).body("Test Ans").author(author).build();
        commentRequest = new CommentRequest("This is a comment");
    }

    @Test
    void addCommentToQuestion_Success() {
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment comment = invocation.getArgument(0);
            comment.setId(100L);
            comment.setCreatedAt(LocalDateTime.now());
            return comment;
        });

        CommentResponse response = commentService.addCommentToQuestion(10L, commentRequest, author);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("This is a comment", response.getBody());
        assertEquals("commenter", response.getAuthor().getUsername());
        verify(commentRepository, times(1)).save(any(Comment.class));
    }

    @Test
    void addCommentToQuestion_NotFound() {
        when(questionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> commentService.addCommentToQuestion(99L, commentRequest, author));
    }

    @Test
    void addCommentToAnswer_Success() {
        when(answerRepository.findById(20L)).thenReturn(Optional.of(answer));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment comment = invocation.getArgument(0);
            comment.setId(200L);
            comment.setCreatedAt(LocalDateTime.now());
            return comment;
        });

        CommentResponse response = commentService.addCommentToAnswer(20L, commentRequest, author);

        assertNotNull(response);
        assertEquals(200L, response.getId());
        assertEquals("This is a comment", response.getBody());
        assertEquals("commenter", response.getAuthor().getUsername());
        verify(commentRepository, times(1)).save(any(Comment.class));
    }

    @Test
    void addCommentToAnswer_NotFound() {
        when(answerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> commentService.addCommentToAnswer(99L, commentRequest, author));
    }
}
