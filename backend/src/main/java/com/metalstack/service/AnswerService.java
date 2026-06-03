package com.metalstack.service;

import com.metalstack.dto.*;
import com.metalstack.email.EmailService;
import com.metalstack.entity.*;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final EmailService emailService;

    public List<AnswerResponse> getAnswers(Long questionId, Long currentUserId) {
        return answerRepository.findByQuestionIdOrderByVoteCountDescCreatedAtAsc(questionId)
                .stream()
                .map(a -> toResponse(a, currentUserId))
                .toList();
    }

    @Transactional
    public AnswerResponse createAnswer(Long questionId, AnswerRequest request, User author) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));

        Answer answer = Answer.builder()
                .body(request.getBody())
                .question(question)
                .author(author)
                .build();

        answer = answerRepository.save(answer);

        // Update answer count
        question.setAnswerCount((int) answerRepository.countByQuestionId(questionId));
        questionRepository.save(question);

        // Send email notification
        emailService.sendNewAnswerNotification(question, answer);

        return toResponse(answer, author.getId());
    }

    private AnswerResponse toResponse(Answer a, Long currentUserId) {
        List<CommentResponse> comments = commentRepository.findByAnswerIdOrderByCreatedAtAsc(a.getId())
                .stream()
                .map(this::toCommentResponse)
                .toList();

        Integer userVote = null;
        if (currentUserId != null) {
            userVote = voteRepository.findByUserIdAndAnswerId(currentUserId, a.getId())
                    .map(v -> v.getValue().intValue())
                    .orElse(null);
        }

        return AnswerResponse.builder()
                .id(a.getId())
                .body(a.getBody())
                .author(UserService.toUserSummary(a.getAuthor()))
                .voteCount(a.getVoteCount())
                .isAccepted(a.getIsAccepted())
                .comments(comments)
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .userVote(userVote)
                .build();
    }

    private CommentResponse toCommentResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .body(c.getBody())
                .author(UserService.toUserSummary(c.getAuthor()))
                .createdAt(c.getCreatedAt())
                .build();
    }
}
