-- MetalStack Schema v2
-- Directed questions + Comment reactions

-- Add directed_to_id column to questions
ALTER TABLE questions ADD COLUMN directed_to_id BIGINT REFERENCES users(id);
CREATE INDEX idx_questions_directed_to ON questions(directed_to_id);

-- Comment reactions (likes)
CREATE TABLE comment_reactions (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    reaction_type VARCHAR(20) NOT NULL DEFAULT 'LIKE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comment_user_reaction UNIQUE (comment_id, user_id, reaction_type)
);

CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user ON comment_reactions(user_id);
