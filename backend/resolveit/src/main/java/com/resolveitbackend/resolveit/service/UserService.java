package com.resolveitbackend.resolveit.service;

import com.resolveitbackend.resolveit.entity.Role;
import com.resolveitbackend.resolveit.entity.User;
import com.resolveitbackend.resolveit.repository.RoleRepository;
import com.resolveitbackend.resolveit.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditLogService auditLogService;

    public User registerUser(User user) {

        // Encode password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Get role from DB
        Role victimRole = roleRepository.findByName("ROLE_VICTIM")
                .orElseThrow(() -> new RuntimeException("Role not found"));

        user.setRoles(Set.of(victimRole));

        // Save user first
        User registeredUser = userRepository.save(user);

        // Log action
        auditLogService.log(
                "REGISTER",
                registeredUser.getId(),
                "User registered with email: " + registeredUser.getEmail()
        );

        return registeredUser;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}