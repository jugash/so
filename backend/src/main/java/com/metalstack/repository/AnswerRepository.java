package com.metalstack.repository;

import com.metalstack.entity.Answer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findByQuestionIdOrderByVoteCountDescCreatedAtAsc(Long questionId);

    Page<Answer> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    long countByQuestionId(Long questionId);
}
