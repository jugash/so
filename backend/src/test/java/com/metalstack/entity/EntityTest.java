package com.metalstack.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class EntityTest {

    @Test
    void testUserEntity() {
        LocalDateTime now = LocalDateTime.now();
        Set<Question> questions = new HashSet<>();
        Set<Answer> answers = new HashSet<>();

        User user = User.builder()
                .id(1L)
                .keycloakId("kc-123")
                .username("testuser")
                .displayName("Test User")
                .email("test@example.com")
                .role("USER")
                .about("About me")
                .reputation(10)
                .emailNotifications(false)
                .createdAt(now)
                .updatedAt(now)
                .questions(questions)
                .answers(answers)
                .build();

        assertEquals(1L, user.getId());
        assertEquals("kc-123", user.getKeycloakId());
        assertEquals("testuser", user.getUsername());
        assertEquals("Test User", user.getDisplayName());
        assertEquals("test@example.com", user.getEmail());
        assertEquals("USER", user.getRole());
        assertEquals("About me", user.getAbout());
        assertEquals(10, user.getReputation());
        assertFalse(user.getEmailNotifications());
        assertEquals(now, user.getCreatedAt());
        assertEquals(now, user.getUpdatedAt());
        assertEquals(questions, user.getQuestions());
        assertEquals(answers, user.getAnswers());

        assertFalse(user.isAdmin());
        assertFalse(user.isModerator());

        user.setRole("MODERATOR");
        assertTrue(user.isModerator());
        assertFalse(user.isAdmin());

        user.setRole("ADMIN");
        assertTrue(user.isAdmin());
        assertTrue(user.isModerator());

        // Test @PreUpdate onUpdate
        user.onUpdate();
        assertNotNull(user.getUpdatedAt());

        // Test setter/getter
        user.setId(2L);
        assertEquals(2L, user.getId());
    }

    @Test
    void testQuestionEntity() {
        LocalDateTime now = LocalDateTime.now();
        User author = new User();
        Set<Answer> answers = new HashSet<>();
        Set<Comment> comments = new HashSet<>();
        Set<Tag> tags = new HashSet<>();

        Question question = Question.builder()
                .id(1L)
                .title("Title")
                .body("Body")
                .author(author)
                .voteCount(5)
                .answerCount(2)
                .viewCount(100)
                .isClosed(true)
                .acceptedAnswerId(10L)
                .createdAt(now)
                .updatedAt(now)
                .answers(answers)
                .comments(comments)
                .tags(tags)
                .build();

        assertEquals(1L, question.getId());
        assertEquals("Title", question.getTitle());
        assertEquals("Body", question.getBody());
        assertEquals(author, question.getAuthor());
        assertEquals(5, question.getVoteCount());
        assertEquals(2, question.getAnswerCount());
        assertEquals(100, question.getViewCount());
        assertTrue(question.getIsClosed());
        assertEquals(10L, question.getAcceptedAnswerId());
        assertEquals(now, question.getCreatedAt());
        assertEquals(now, question.getUpdatedAt());
        assertEquals(answers, question.getAnswers());
        assertEquals(comments, question.getComments());
        assertEquals(tags, question.getTags());

        question.onUpdate();
        assertNotNull(question.getUpdatedAt());

        question.setTitle("New Title");
        assertEquals("New Title", question.getTitle());
    }

    @Test
    void testAnswerEntity() {
        LocalDateTime now = LocalDateTime.now();
        Question question = new Question();
        User author = new User();
        Set<Comment> comments = new HashSet<>();

        Answer answer = Answer.builder()
                .id(1L)
                .body("Answer Body")
                .question(question)
                .author(author)
                .voteCount(3)
                .isAccepted(true)
                .createdAt(now)
                .updatedAt(now)
                .comments(comments)
                .build();

        assertEquals(1L, answer.getId());
        assertEquals("Answer Body", answer.getBody());
        assertEquals(question, answer.getQuestion());
        assertEquals(author, answer.getAuthor());
        assertEquals(3, answer.getVoteCount());
        assertTrue(answer.getIsAccepted());
        assertEquals(now, answer.getCreatedAt());
        assertEquals(now, answer.getUpdatedAt());
        assertEquals(comments, answer.getComments());

        answer.onUpdate();
        assertNotNull(answer.getUpdatedAt());

        answer.setBody("New Answer Body");
        assertEquals("New Answer Body", answer.getBody());
    }

    @Test
    void testCommentEntity() {
        LocalDateTime now = LocalDateTime.now();
        User author = new User();
        Question question = new Question();
        Answer answer = new Answer();

        Comment comment = Comment.builder()
                .id(1L)
                .body("Comment Body")
                .author(author)
                .question(question)
                .answer(answer)
                .createdAt(now)
                .build();

        assertEquals(1L, comment.getId());
        assertEquals("Comment Body", comment.getBody());
        assertEquals(author, comment.getAuthor());
        assertEquals(question, comment.getQuestion());
        assertEquals(answer, comment.getAnswer());
        assertEquals(now, comment.getCreatedAt());

        comment.setBody("New Comment Body");
        assertEquals("New Comment Body", comment.getBody());
    }

    @Test
    void testVoteEntity() {
        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        Question question = new Question();
        Answer answer = new Answer();

        Vote vote = Vote.builder()
                .id(1L)
                .user(user)
                .question(question)
                .answer(answer)
                .value((short) 1)
                .createdAt(now)
                .build();

        assertEquals(1L, vote.getId());
        assertEquals(user, vote.getUser());
        assertEquals(question, vote.getQuestion());
        assertEquals(answer, vote.getAnswer());
        assertEquals((short) 1, vote.getValue());
        assertEquals(now, vote.getCreatedAt());

        vote.setValue((short) -1);
        assertEquals((short) -1, vote.getValue());
    }

    @Test
    void testTagEntity() {
        Set<Question> questions = new HashSet<>();

        Tag tag = Tag.builder()
                .id(1L)
                .name("java")
                .description("Java programming language")
                .questionCount(12)
                .questions(questions)
                .build();

        assertEquals(1L, tag.getId());
        assertEquals("java", tag.getName());
        assertEquals("Java programming language", tag.getDescription());
        assertEquals(12, tag.getQuestionCount());
        assertEquals(questions, tag.getQuestions());

        tag.setName("spring");
        assertEquals("spring", tag.getName());
    }

    @Test
    void testNoArgsConstructorAllArgsConstructor() {
        // Just verify constructors and builder toString/etc compile and execute
        assertNotNull(new User());
        assertNotNull(new Question());
        assertNotNull(new Answer());
        assertNotNull(new Comment());
        assertNotNull(new Vote());
        assertNotNull(new Tag());

        assertNotNull(new User(1L, "k", "u", "d", "e", "r", "a", 1, true, LocalDateTime.now(), LocalDateTime.now(), new HashSet<>(), new HashSet<>()));
        assertNotNull(new Question(1L, "t", "b", new User(), 0, 0, 0, false, null, LocalDateTime.now(), LocalDateTime.now(), new HashSet<>(), new HashSet<>(), new HashSet<>()));
        assertNotNull(new Answer(1L, "b", new Question(), new User(), 0, false, LocalDateTime.now(), LocalDateTime.now(), new HashSet<>()));
        assertNotNull(new Comment(1L, "b", new User(), new Question(), new Answer(), LocalDateTime.now()));
        assertNotNull(new Vote(1L, new User(), new Question(), new Answer(), (short) 1, LocalDateTime.now()));
        assertNotNull(new Tag(1L, "n", "d", 0, new HashSet<>()));
    }
}
