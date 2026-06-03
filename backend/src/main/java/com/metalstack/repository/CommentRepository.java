package com.metalstack.repository;

import com.metalstack.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByQuestionIdOrderByCreatedAtAsc(Long questionId);

    List<Comment> findByAnswerIdOrderByCreatedAtAsc(Long answerId);
}
