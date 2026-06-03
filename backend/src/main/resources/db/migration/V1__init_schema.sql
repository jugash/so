-- MetalStack Schema v1
-- Internal StackOverflow Clone (Keycloak Auth)

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    keycloak_id VARCHAR(255) UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    about TEXT,
    reputation INT NOT NULL DEFAULT 1,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    question_count INT NOT NULL DEFAULT 0
);

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    author_id BIGINT NOT NULL REFERENCES users(id),
    vote_count INT NOT NULL DEFAULT 0,
    answer_count INT NOT NULL DEFAULT 0,
    view_count INT NOT NULL DEFAULT 0,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_answer_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE answers (
    id BIGSERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    vote_count INT NOT NULL DEFAULT 0,
    is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE questions
    ADD CONSTRAINT fk_accepted_answer FOREIGN KEY (accepted_answer_id) REFERENCES answers(id);

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    author_id BIGINT NOT NULL REFERENCES users(id),
    question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE,
    answer_id BIGINT REFERENCES answers(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_comment_parent CHECK (
        (question_id IS NOT NULL AND answer_id IS NULL) OR
        (question_id IS NULL AND answer_id IS NOT NULL)
    )
);

CREATE TABLE question_tags (
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

CREATE TABLE votes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE,
    answer_id BIGINT REFERENCES answers(id) ON DELETE CASCADE,
    value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_vote_target CHECK (
        (question_id IS NOT NULL AND answer_id IS NULL) OR
        (question_id IS NULL AND answer_id IS NOT NULL)
    ),
    CONSTRAINT uq_user_question_vote UNIQUE (user_id, question_id),
    CONSTRAINT uq_user_answer_vote UNIQUE (user_id, answer_id)
);

-- Indexes
CREATE INDEX idx_questions_author ON questions(author_id);
CREATE INDEX idx_questions_created ON questions(created_at DESC);
CREATE INDEX idx_questions_votes ON questions(vote_count DESC);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_author ON answers(author_id);
CREATE INDEX idx_comments_question ON comments(question_id);
CREATE INDEX idx_comments_answer ON comments(answer_id);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_users_keycloak ON users(keycloak_id);

-- Full-text search
ALTER TABLE questions ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION update_question_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                         setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_question_search_vector
    BEFORE INSERT OR UPDATE OF title, body ON questions
    FOR EACH ROW EXECUTE FUNCTION update_question_search_vector();

CREATE INDEX idx_questions_search ON questions USING GIN(search_vector);
