package com.metalstack.repository;

import com.metalstack.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    Page<Question> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Question> findAllByOrderByVoteCountDesc(Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.answerCount = 0 ORDER BY q.createdAt DESC")
    Page<Question> findUnanswered(Pageable pageable);

    Page<Question> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    @Query("SELECT q FROM Question q JOIN q.tags t WHERE t.name = :tagName ORDER BY q.createdAt DESC")
    Page<Question> findByTagName(@Param("tagName") String tagName, Pageable pageable);

    @Query(value = "SELECT q.* FROM questions q WHERE q.search_vector @@ plainto_tsquery('english', :query) " +
                   "ORDER BY ts_rank(q.search_vector, plainto_tsquery('english', :query)) DESC",
           countQuery = "SELECT COUNT(*) FROM questions q WHERE q.search_vector @@ plainto_tsquery('english', :query)",
           nativeQuery = true)
    Page<Question> searchFullText(@Param("query") String query, Pageable pageable);
}
