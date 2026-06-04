package com.metalstack.repository;

import com.metalstack.entity.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    int countByCommentIdAndReactionType(Long commentId, String reactionType);
    boolean existsByCommentIdAndUserIdAndReactionType(Long commentId, Long userId, String reactionType);
    Optional<CommentReaction> findByCommentIdAndUserIdAndReactionType(Long commentId, Long userId, String reactionType);
}
