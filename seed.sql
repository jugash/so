-- MetalStack External Seed Data Script
-- Populates the Postgres database with realistic development data

-- Clear existing data (in reverse order of foreign keys)
TRUNCATE votes, comments, question_tags, answers, questions, tags, users RESTART IDENTITY CASCADE;

-- 1. Insert Seed Users with Pre-configured Keycloak UUIDs
INSERT INTO users (id, keycloak_id, username, display_name, email, role, reputation, email_notifications, created_at) VALUES
(1, '11111111-1111-1111-1111-111111111111', 'admin', 'Admin User', 'admin@metalstack.dev', 'ADMIN', 100, true, NOW() - INTERVAL '10 days'),
(2, '22222222-2222-2222-2222-222222222222', 'moderator', 'Moderator User', 'moderator@metalstack.dev', 'MODERATOR', 50, true, NOW() - INTERVAL '9 days'),
(3, '33333333-3333-3333-3333-333333333333', 'user1', 'Alice Developer', 'user1@metalstack.dev', 'USER', 25, true, NOW() - INTERVAL '8 days'),
(4, '44444444-4444-4444-4444-444444444444', 'user2', 'Bob Architect', 'user2@metalstack.dev', 'USER', 15, true, NOW() - INTERVAL '7 days');

-- Reset users primary key sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. Insert Seed Tags
INSERT INTO tags (id, name, description, question_count) VALUES
(1, 'spring-boot', 'Spring Boot is a framework designed to simplify the bootstrapping and development of new Spring applications.', 1),
(2, 'react', 'React is a popular JavaScript library for building user interfaces, developed by Meta.', 0),
(3, 'keycloak', 'Keycloak is an open source software product to allow single sign-on with Identity and Access Management.', 2),
(4, 'postgres', 'PostgreSQL is a powerful, open-source object-relational database system.', 0),
(5, 'gradle', 'Gradle is an open-source build automation system that builds upon the concepts of Apache Ant and Apache Maven.', 1),
(6, 'podman', 'Podman is a daemonless container engine for developing, managing, and running OCI Containers.', 1);

SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));

-- 3. Insert Questions
INSERT INTO questions (id, title, body, author_id, vote_count, answer_count, view_count, is_closed, created_at, updated_at) VALUES
(1, 'Audience claim mismatch in Spring Boot Security with Keycloak', 'I am configuring a Spring Boot 3 Resource Server with an external Keycloak instance. I get a 401 status code with `Invalid token` error, and the logs say: `Audience validation failed`.

Here is my JWT config in `application.yml`:
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/metalstack
```

How do I configure Spring Boot to accept the audience claim or tell Keycloak to include the correct client id in the audience claim?', 3, 5, 1, 142, false, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),

(2, 'How to use Podman with Gradle Jib plugin instead of Docker?', 'I am trying to run Jib to build a container image directly to my local Podman daemon on my mac.

However, Jib defaults to searching for the Docker socket.

How do I configure `build.gradle` to use the Podman executable instead of the Docker CLI client? It fails with "Docker daemon not running" when running `./gradlew jibDockerBuild`.', 4, 12, 1, 98, false, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

(3, 'Guidelines for MetalStack OIDC integration and RBAC mapping', 'Here are the official team guidelines forauthentication. We use Keycloak OIDC with three roles:

- `ADMIN` (highest permission)
- `MODERATOR` (moderation & closing questions)
- `USER` (default, create questions & answers)

Ensure your client ID is `metalstack-frontend` and configure role mappers under the realm roles to include `realm_access.roles` claim in access tokens.', 1, 2, 0, 47, false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));

-- 4. Insert Question-Tag relations
INSERT INTO question_tags (question_id, tag_id) VALUES
(1, 1), -- Q1 is tagged spring-boot
(1, 3), -- Q1 is tagged keycloak
(2, 5), -- Q2 is tagged gradle
(2, 6), -- Q2 is tagged podman
(3, 3); -- Q3 is tagged keycloak

-- 5. Insert Answers
INSERT INTO answers (id, body, question_id, author_id, vote_count, is_accepted, created_at, updated_at) VALUES
(1, 'You can resolve this either by configuring Keycloak to map the client ID to the audience claim, or by customizing the `JwtDecoder` in Spring Security.

To do it in Spring Security, configure a custom token validator:

```java
@Bean
public JwtDecoder jwtDecoder() {
    NimbusJwtDecoder jwtDecoder = JwtDecoders.fromOidcIssuerLocation(issuerUri);
    OAuth2TokenValidator<Jwt> withAudience = new DelegatingOAuth2TokenValidator<>(
            new JwtTimestampValidator(),
            new JwtIssuerValidator(issuerUri),
            new AudienceValidator("your-expected-audience") // Custom validator
    );
    jwtDecoder.setJwtValidator(withAudience);
    return jwtDecoder;
}
```', 1, 2, 4, false, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

(2, 'You can configure the `jib.dockerClient` extension block in your `build.gradle` script:

```groovy
jib {
    dockerClient {
        executable = "podman"
    }
}
```

This tells Jib to invoke Podman instead of the Docker client binary. Jib will successfully build and load the image directly into your local Podman image store using `./gradlew jibDockerBuild`.', 2, 3, 9, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

SELECT setval('answers_id_seq', (SELECT MAX(id) FROM answers));

-- Update accepted answer on Question 2
UPDATE questions SET accepted_answer_id = 2, answer_count = 1 WHERE id = 2;
UPDATE questions SET answer_count = 1 WHERE id = 1;

-- 6. Insert Comments
INSERT INTO comments (id, body, author_id, question_id, answer_id, created_at) VALUES
(1, 'Are you using Keycloak version 25 or higher?', 4, 1, NULL, NOW() - INTERVAL '2 days 23 hours'),
(2, 'Thank you! This worked perfectly on my macOS system with Podman 5.4.', 4, NULL, 2, NOW() - INTERVAL '18 hours');

SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));

-- 7. Insert Votes to create realistic scores
INSERT INTO votes (id, user_id, question_id, answer_id, value, created_at) VALUES
-- Q1 votes (+5 score)
(1, 1, 1, NULL, 1, NOW() - INTERVAL '2 days 20 hours'),
(2, 2, 1, NULL, 1, NOW() - INTERVAL '2 days 18 hours'),
(3, 4, 1, NULL, 1, NOW() - INTERVAL '2 days 12 hours'),
(4, 3, 1, NULL, 1, NOW() - INTERVAL '2 days 10 hours'), -- (Self-votes allowed in initial setup for stats)
(5, 1, NULL, 1, 1, NOW() - INTERVAL '2 days'),
(6, 4, NULL, 1, 1, NOW() - INTERVAL '2 days'),

-- Q2 votes (+12 score)
(7, 1, 2, NULL, 1, NOW() - INTERVAL '1 day 20 hours'),
(8, 2, 2, NULL, 1, NOW() - INTERVAL '1 day 18 hours'),
(9, 3, 2, NULL, 1, NOW() - INTERVAL '1 day 16 hours'),
(10, 1, NULL, 2, 1, NOW() - INTERVAL '1 day'),
(11, 2, NULL, 2, 1, NOW() - INTERVAL '1 day'),
(12, 4, NULL, 2, 1, NOW() - INTERVAL '1 day'),

-- Q3 votes (+2 score)
(13, 2, 3, NULL, 1, NOW() - INTERVAL '4 days'),
(14, 3, 3, NULL, 1, NOW() - INTERVAL '4 days');

SELECT setval('votes_id_seq', (SELECT MAX(id) FROM votes));

-- 8. Recalculate and update denormalized counts
UPDATE tags t SET question_count = (
    SELECT COUNT(*) FROM question_tags qt WHERE qt.tag_id = t.id
);
