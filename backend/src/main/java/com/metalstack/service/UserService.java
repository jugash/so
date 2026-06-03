package com.metalstack.service;

import com.metalstack.dto.*;
import com.metalstack.entity.User;
import com.metalstack.exception.ResourceNotFoundException;
import com.metalstack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .about(user.getAbout())
                .reputation(user.getReputation())
                .questionCount(user.getQuestions().size())
                .answerCount(user.getAnswers().size())
                .emailNotifications(user.getEmailNotifications())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateEmailNotifications(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setEmailNotifications(enabled);
        userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    public static UserSummary toUserSummary(User user) {
        return UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .reputation(user.getReputation())
                .build();
    }
}
