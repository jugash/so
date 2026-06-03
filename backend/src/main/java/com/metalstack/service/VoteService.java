package com.metalstack.service;

import com.metalstack.dto.VoteRequest;
import com.metalstack.entity.*;
import com.metalstack.exception.DuplicateVoteException;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final VoteRepository voteRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;

    @Transactional
    public void vote(VoteRequest request, User voter) {
        if (request.getValue() != 1 && request.getValue() != -1) {
            throw new IllegalArgumentException("Vote value must be +1 or -1");
        }

        if (request.getQuestionId() != null) {
            voteOnQuestion(request.getQuestionId(), request.getValue(), voter);
        } else if (request.getAnswerId() != null) {
            voteOnAnswer(request.getAnswerId(), request.getValue(), voter);
        } else {
            throw new IllegalArgumentException("Either questionId or answerId must be provided");
        }
    }

    private void voteOnQuestion(Long questionId, short value, User voter) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));

        if (question.getAuthor().getId().equals(voter.getId())) {
            throw new IllegalArgumentException("You cannot vote on your own question");
        }

        Optional<Vote> existing = voteRepository.findByUserIdAndQuestionId(voter.getId(), questionId);

        if (existing.isPresent()) {
            Vote vote = existing.get();
            if (vote.getValue() == value) {
                // Remove vote (toggle off)
                voteRepository.delete(vote);
                question.setVoteCount(question.getVoteCount() - value);
                updateReputation(question.getAuthor(), -value);
            } else {
                // Change vote direction
                vote.setValue(value);
                voteRepository.save(vote);
                question.setVoteCount(question.getVoteCount() + (2 * value));
                updateReputation(question.getAuthor(), 2 * value);
            }
        } else {
            // New vote
            Vote vote = Vote.builder()
                    .user(voter)
                    .question(question)
                    .value(value)
                    .build();
            voteRepository.save(vote);
            question.setVoteCount(question.getVoteCount() + value);
            updateReputation(question.getAuthor(), value);
        }

        questionRepository.save(question);
    }

    private void voteOnAnswer(Long answerId, short value, User voter) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer", "id", answerId));

        if (answer.getAuthor().getId().equals(voter.getId())) {
            throw new IllegalArgumentException("You cannot vote on your own answer");
        }

        Optional<Vote> existing = voteRepository.findByUserIdAndAnswerId(voter.getId(), answerId);

        if (existing.isPresent()) {
            Vote vote = existing.get();
            if (vote.getValue() == value) {
                voteRepository.delete(vote);
                answer.setVoteCount(answer.getVoteCount() - value);
                updateReputation(answer.getAuthor(), -value);
            } else {
                vote.setValue(value);
                voteRepository.save(vote);
                answer.setVoteCount(answer.getVoteCount() + (2 * value));
                updateReputation(answer.getAuthor(), 2 * value);
            }
        } else {
            Vote vote = Vote.builder()
                    .user(voter)
                    .answer(answer)
                    .value(value)
                    .build();
            voteRepository.save(vote);
            answer.setVoteCount(answer.getVoteCount() + value);
            updateReputation(answer.getAuthor(), value);
        }

        answerRepository.save(answer);
    }

    private void updateReputation(User user, int delta) {
        // Upvote = +10 rep, downvote = -2 rep (SO-style)
        int repChange = delta > 0 ? delta * 10 : delta * 2;
        user.setReputation(Math.max(1, user.getReputation() + repChange));
        userRepository.save(user);
    }
}
