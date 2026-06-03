package com.metalstack.repository;

import com.metalstack.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByUserIdAndQuestionId(Long userId, Long questionId);

    Optional<Vote> findByUserIdAndAnswerId(Long userId, Long answerId);
}
