package com.metalstack.service;

import com.metalstack.dto.CommentRequest;
import com.metalstack.dto.CommentResponse;
import com.metalstack.dto.UserSummary;
import com.metalstack.entity.*;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    @Transactional
    public CommentResponse addCommentToQuestion(Long questionId, CommentRequest request, User author) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));

        Comment comment = Comment.builder()
                .body(request.getBody())
                .author(author)
                .question(question)
                .build();

        comment = commentRepository.save(comment);
        return toResponse(comment);
    }

    @Transactional
    public CommentResponse addCommentToAnswer(Long answerId, CommentRequest request, User author) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer", "id", answerId));

        Comment comment = Comment.builder()
                .body(request.getBody())
                .author(author)
                .answer(answer)
                .build();

        comment = commentRepository.save(comment);
        return toResponse(comment);
    }

    private CommentResponse toResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .body(c.getBody())
                .author(UserService.toUserSummary(c.getAuthor()))
                .createdAt(c.getCreatedAt())
                .build();
    }
}
