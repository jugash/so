package com.metalstack.service;

import com.metalstack.dto.VoteRequest;
import com.metalstack.entity.*;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VoteServiceTest {

    @Mock
    private VoteRepository voteRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private AnswerRepository answerRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private VoteService voteService;

    private User author;
    private User voter;
    private Question question;
    private Answer answer;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).username("author").reputation(50).build();
        voter = User.builder().id(2L).username("voter").reputation(30).build();
        question = Question.builder().id(10L).author(author).voteCount(0).build();
        answer = Answer.builder().id(20L).author(author).voteCount(0).build();
    }

    @Test
    void vote_InvalidValue() {
        VoteRequest request = new VoteRequest(10L, null, (short) 5);
        assertThrows(IllegalArgumentException.class, () -> voteService.vote(request, voter));
    }

    @Test
    void vote_NoIdsProvided() {
        VoteRequest request = new VoteRequest(null, null, (short) 1);
        assertThrows(IllegalArgumentException.class, () -> voteService.vote(request, voter));
    }

    @Test
    void voteOnQuestion_SelfVoting() {
        VoteRequest request = new VoteRequest(10L, null, (short) 1);
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        // Author votes on own question
        assertThrows(IllegalArgumentException.class, () -> voteService.vote(request, author));
    }

    @Test
    void voteOnQuestion_NotFound() {
        VoteRequest request = new VoteRequest(99L, null, (short) 1);
        when(questionRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> voteService.vote(request, voter));
    }

    @Test
    void voteOnQuestion_NewUpvote() {
        VoteRequest request = new VoteRequest(10L, null, (short) 1);
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(voteRepository.findByUserIdAndQuestionId(2L, 10L)).thenReturn(Optional.empty());

        voteService.vote(request, voter);

        assertEquals(1, question.getVoteCount());
        assertEquals(60, author.getReputation()); // +10 reputation
        verify(voteRepository, times(1)).save(any(Vote.class));
        verify(questionRepository, times(1)).save(question);
        verify(userRepository, times(1)).save(author);
    }

    @Test
    void voteOnQuestion_NewDownvote() {
        VoteRequest request = new VoteRequest(10L, null, (short) -1);
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(voteRepository.findByUserIdAndQuestionId(2L, 10L)).thenReturn(Optional.empty());

        voteService.vote(request, voter);

        assertEquals(-1, question.getVoteCount());
        assertEquals(48, author.getReputation()); // -2 reputation
        verify(voteRepository, times(1)).save(any(Vote.class));
    }

    @Test
    void voteOnQuestion_ToggleOff() {
        VoteRequest request = new VoteRequest(10L, null, (short) 1);
        Vote existingVote = Vote.builder().id(100L).user(voter).question(question).value((short) 1).build();
        question.setVoteCount(1);
        
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(voteRepository.findByUserIdAndQuestionId(2L, 10L)).thenReturn(Optional.of(existingVote));

        voteService.vote(request, voter);

        assertEquals(0, question.getVoteCount());
        assertEquals(48, author.getReputation()); // reputation decreased by -2 (downvote rep change logic triggered since delta = -1)
        verify(voteRepository, times(1)).delete(existingVote);
    }

    @Test
    void voteOnQuestion_ChangeDirection() {
        VoteRequest request = new VoteRequest(10L, null, (short) -1);
        Vote existingVote = Vote.builder().id(100L).user(voter).question(question).value((short) 1).build();
        question.setVoteCount(1);

        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(voteRepository.findByUserIdAndQuestionId(2L, 10L)).thenReturn(Optional.of(existingVote));

        voteService.vote(request, voter);

        assertEquals(-1, question.getVoteCount());
        assertEquals((short) -1, existingVote.getValue());
        verify(voteRepository, times(1)).save(existingVote);
    }

    @Test
    void voteOnAnswer_SelfVoting() {
        VoteRequest request = new VoteRequest(null, 20L, (short) 1);
        when(answerRepository.findById(20L)).thenReturn(Optional.of(answer));
        assertThrows(IllegalArgumentException.class, () -> voteService.vote(request, author));
    }

    @Test
    void voteOnAnswer_NotFound() {
        VoteRequest request = new VoteRequest(null, 99L, (short) 1);
        when(answerRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> voteService.vote(request, voter));
    }

    @Test
    void voteOnAnswer_NewUpvote() {
        VoteRequest request = new VoteRequest(null, 20L, (short) 1);
        when(answerRepository.findById(20L)).thenReturn(Optional.of(answer));
        when(voteRepository.findByUserIdAndAnswerId(2L, 20L)).thenReturn(Optional.empty());

        voteService.vote(request, voter);

        assertEquals(1, answer.getVoteCount());
        assertEquals(60, author.getReputation());
        verify(voteRepository, times(1)).save(any(Vote.class));
        verify(answerRepository, times(1)).save(answer);
    }

    @Test
    void voteOnAnswer_ToggleOff() {
        VoteRequest request = new VoteRequest(null, 20L, (short) -1);
        Vote existingVote = Vote.builder().id(200L).user(voter).answer(answer).value((short) -1).build();
        answer.setVoteCount(-1);

        when(answerRepository.findById(20L)).thenReturn(Optional.of(answer));
        when(voteRepository.findByUserIdAndAnswerId(2L, 20L)).thenReturn(Optional.of(existingVote));

        voteService.vote(request, voter);

        assertEquals(0, answer.getVoteCount());
        verify(voteRepository, times(1)).delete(existingVote);
    }

    @Test
    void voteOnAnswer_ChangeDirection() {
        VoteRequest request = new VoteRequest(null, 20L, (short) 1);
        Vote existingVote = Vote.builder().id(200L).user(voter).answer(answer).value((short) -1).build();
        answer.setVoteCount(-1);

        when(answerRepository.findById(20L)).thenReturn(Optional.of(answer));
        when(voteRepository.findByUserIdAndAnswerId(2L, 20L)).thenReturn(Optional.of(existingVote));

        voteService.vote(request, voter);

        assertEquals(1, answer.getVoteCount());
        assertEquals((short) 1, existingVote.getValue());
        verify(voteRepository, times(1)).save(existingVote);
    }
}
