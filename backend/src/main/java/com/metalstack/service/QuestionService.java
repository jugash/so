package com.metalstack.service;

import com.metalstack.dto.*;
import com.metalstack.entity.*;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final TagService tagService;

    public Page<QuestionResponse> getQuestions(String sort, String tag, Pageable pageable, Long currentUserId) {
        Page<Question> questions;

        if (tag != null && !tag.isBlank()) {
            questions = questionRepository.findByTagName(tag, pageable);
        } else {
            questions = switch (sort) {
                case "votes" -> questionRepository.findAllByOrderByVoteCountDesc(pageable);
                case "unanswered" -> questionRepository.findUnanswered(pageable);
                default -> questionRepository.findAllByOrderByCreatedAtDesc(pageable);
            };
        }

        return questions.map(q -> toResponse(q, currentUserId));
    }

    @Transactional
    public QuestionResponse getQuestion(Long id, Long currentUserId) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));

        // Increment view count
        question.setViewCount(question.getViewCount() + 1);
        questionRepository.save(question);

        return toResponse(question, currentUserId);
    }

    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request, User author) {
        Set<Tag> tags = tagService.getOrCreateTags(request.getTags());

        Question question = Question.builder()
                .title(request.getTitle())
                .body(request.getBody())
                .author(author)
                .tags(tags)
                .build();

        question = questionRepository.save(question);
        tagService.incrementQuestionCount(tags);

        return toResponse(question, author.getId());
    }

    @Transactional
    public QuestionResponse updateQuestion(Long id, QuestionRequest request, User author) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));

        if (!question.getAuthor().getId().equals(author.getId())) {
            throw new IllegalArgumentException("You can only edit your own questions");
        }

        // Update tags
        tagService.decrementQuestionCount(question.getTags());
        Set<Tag> newTags = tagService.getOrCreateTags(request.getTags());

        question.setTitle(request.getTitle());
        question.setBody(request.getBody());
        question.setTags(newTags);
        question = questionRepository.save(question);

        tagService.incrementQuestionCount(newTags);
        return toResponse(question, author.getId());
    }

    @Transactional
    public void deleteQuestion(Long id, User author) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));

        if (!question.getAuthor().getId().equals(author.getId()) && !author.isAdmin()) {
            throw new IllegalArgumentException("You can only delete your own questions");
        }

        tagService.decrementQuestionCount(question.getTags());
        questionRepository.delete(question);
    }

    @Transactional
    public void closeQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));
        question.setIsClosed(true);
        questionRepository.save(question);
    }

    @Transactional
    public QuestionResponse acceptAnswer(Long questionId, Long answerId, User author) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));

        if (!question.getAuthor().getId().equals(author.getId())) {
            throw new IllegalArgumentException("Only the question author can accept an answer");
        }

        // Un-accept previous answer if any
        if (question.getAcceptedAnswerId() != null) {
            question.getAnswers().stream()
                    .filter(a -> a.getId().equals(question.getAcceptedAnswerId()))
                    .findFirst()
                    .ifPresent(a -> a.setIsAccepted(false));
        }

        // Accept new answer
        question.getAnswers().stream()
                .filter(a -> a.getId().equals(answerId))
                .findFirst()
                .ifPresent(a -> a.setIsAccepted(true));

        question.setAcceptedAnswerId(answerId);
        questionRepository.save(question);

        return toResponse(question, author.getId());
    }

    public Page<QuestionResponse> searchQuestions(String query, Pageable pageable, Long currentUserId) {
        return questionRepository.searchFullText(query, pageable)
                .map(q -> toResponse(q, currentUserId));
    }

    public Page<QuestionResponse> getQuestionsByAuthor(Long authorId, Pageable pageable, Long currentUserId) {
        return questionRepository.findByAuthorIdOrderByCreatedAtDesc(authorId, pageable)
                .map(q -> toResponse(q, currentUserId));
    }

    private QuestionResponse toResponse(Question q, Long currentUserId) {
        List<CommentResponse> comments = commentRepository.findByQuestionIdOrderByCreatedAtAsc(q.getId())
                .stream()
                .map(this::toCommentResponse)
                .toList();

        Integer userVote = null;
        if (currentUserId != null) {
            userVote = voteRepository.findByUserIdAndQuestionId(currentUserId, q.getId())
                    .map(v -> v.getValue().intValue())
                    .orElse(null);
        }

        return QuestionResponse.builder()
                .id(q.getId())
                .title(q.getTitle())
                .body(q.getBody())
                .author(UserService.toUserSummary(q.getAuthor()))
                .voteCount(q.getVoteCount())
                .answerCount(q.getAnswerCount())
                .viewCount(q.getViewCount())
                .isClosed(q.getIsClosed())
                .acceptedAnswerId(q.getAcceptedAnswerId())
                .tags(q.getTags().stream().map(tagService::toResponse).collect(java.util.stream.Collectors.toSet()))
                .comments(comments)
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
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
