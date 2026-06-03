package com.metalstack.service;

import com.metalstack.dto.AnswerRequest;
import com.metalstack.dto.AnswerResponse;
import com.metalstack.email.EmailService;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AnswerServiceTest {

    @Mock
    private AnswerRepository answerRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private VoteRepository voteRepository;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private AnswerService answerService;

    private User author;
    private Question question;
    private Answer answer;
    private AnswerRequest answerRequest;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).username("testuser").displayName("Test User").reputation(100).build();
        question = Question.builder().id(10L).title("Question Title").body("Question Body").author(author).build();
        answer = Answer.builder().id(100L).body("Answer Body").question(question).author(author).voteCount(5).isAccepted(true).createdAt(LocalDateTime.now()).build();
        answerRequest = new AnswerRequest("Answer Body");
    }

    @Test
    void getAnswers_Success() {
        when(answerRepository.findByQuestionIdOrderByVoteCountDescCreatedAtAsc(10L)).thenReturn(Collections.singletonList(answer));
        when(commentRepository.findByAnswerIdOrderByCreatedAtAsc(100L)).thenReturn(Collections.emptyList());
        when(voteRepository.findByUserIdAndAnswerId(1L, 100L)).thenReturn(Optional.of(Vote.builder().value((short) 1).build()));

        List<AnswerResponse> responses = answerService.getAnswers(10L, 1L);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(100L, responses.get(0).getId());
        assertEquals("Answer Body", responses.get(0).getBody());
        assertEquals(5, responses.get(0).getVoteCount());
        assertTrue(responses.get(0).isAccepted());
        assertEquals(1, responses.get(0).getUserVote());
    }

    @Test
    void createAnswer_Success() {
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(answerRepository.save(any(Answer.class))).thenReturn(answer);
        when(answerRepository.countByQuestionId(10L)).thenReturn(1L);

        AnswerResponse response = answerService.createAnswer(10L, answerRequest, author);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(1, question.getAnswerCount());
        verify(emailService, times(1)).sendNewAnswerNotification(eq(question), any(Answer.class));
        verify(answerRepository, times(1)).save(any(Answer.class));
        verify(questionRepository, times(1)).save(question);
    }

    @Test
    void createAnswer_QuestionNotFound() {
        when(questionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> answerService.createAnswer(99L, answerRequest, author));
    }
}
