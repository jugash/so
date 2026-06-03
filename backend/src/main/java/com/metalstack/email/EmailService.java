package com.metalstack.email;

import com.metalstack.entity.Answer;
import com.metalstack.entity.Question;
import com.metalstack.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.base-url}")
    private String baseUrl;

    @Async
    public void sendNewAnswerNotification(Question question, Answer answer) {
        User questionAuthor = question.getAuthor();

        if (!questionAuthor.getEmailNotifications()) {
            log.debug("Email notifications disabled for user {}", questionAuthor.getUsername());
            return;
        }

        // Don't notify if the question author answered their own question
        if (questionAuthor.getId().equals(answer.getAuthor().getId())) {
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(questionAuthor.getEmail());
            message.setSubject("[MetalStack] New answer on: " + question.getTitle());
            message.setText(buildAnswerNotificationBody(question, answer));

            mailSender.send(message);
            log.info("Sent new answer notification to {} for question {}", questionAuthor.getEmail(), question.getId());
        } catch (Exception e) {
            log.error("Failed to send email notification to {}: {}", questionAuthor.getEmail(), e.getMessage());
        }
    }

    private String buildAnswerNotificationBody(Question question, Answer answer) {
        String questionUrl = baseUrl + "/questions/" + question.getId();
        String preview = answer.getBody().length() > 200
                ? answer.getBody().substring(0, 200) + "..."
                : answer.getBody();

        return String.format("""
                Hi %s,

                %s posted a new answer on your question:

                "%s"

                Answer preview:
                ---
                %s
                ---

                View the full answer: %s

                —
                MetalStack — Internal Q&A Platform

                To disable email notifications, update your profile settings.
                """,
                questionAuthor(question),
                answer.getAuthor().getDisplayName(),
                question.getTitle(),
                preview,
                questionUrl);
    }

    private String questionAuthor(Question question) {
        return question.getAuthor().getDisplayName();
    }
}
