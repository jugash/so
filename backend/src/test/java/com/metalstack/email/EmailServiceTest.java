package com.metalstack.email;

import com.metalstack.entity.Answer;
import com.metalstack.entity.Question;
import com.metalstack.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    private User author;
    private User responder;
    private Question question;
    private Answer answer;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).username("author").displayName("Alice Author").email("alice@metalstack.dev").emailNotifications(true).build();
        responder = User.builder().id(2L).username("responder").displayName("Bob Responder").email("bob@metalstack.dev").build();
        question = Question.builder().id(10L).title("How to test?").author(author).build();
        answer = Answer.builder().id(100L).body("Use mockito. " + "a".repeat(250)).question(question).author(responder).build();

        ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@metalstack.dev");
        ReflectionTestUtils.setField(emailService, "baseUrl", "http://localhost:5173");
    }

    @Test
    void sendNewAnswerNotification_Disabled() {
        author.setEmailNotifications(false);

        emailService.sendNewAnswerNotification(question, answer);

        verifyNoInteractions(mailSender);
    }

    @Test
    void sendNewAnswerNotification_SelfAnswered() {
        // Author answers their own question
        answer.setAuthor(author);

        emailService.sendNewAnswerNotification(question, answer);

        verifyNoInteractions(mailSender);
    }

    @Test
    void sendNewAnswerNotification_Success() {
        emailService.sendNewAnswerNotification(question, answer);

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendNewAnswerNotification_SendFailure() {
        doThrow(new RuntimeException("SMTP unavailable")).when(mailSender).send(any(SimpleMailMessage.class));

        // Should not propagate exceptions but log them
        emailService.sendNewAnswerNotification(question, answer);

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }
}
