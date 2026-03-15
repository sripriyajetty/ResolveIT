package com.resolveitbackend.resolveit.controller;

import com.resolveitbackend.resolveit.dto.LoginRequest;
import com.resolveitbackend.resolveit.dto.LoginResponse;
import com.resolveitbackend.resolveit.entity.User;
import com.resolveitbackend.resolveit.security.JwtUtil;
import com.resolveitbackend.resolveit.service.UserService;
import com.resolveitbackend.resolveit.service.AuditLogService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private AuditLogService auditLogService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            registeredUser.setPassword(null);
            return ResponseEntity.ok(registeredUser);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        try {

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);

            User user = userService.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // audit log
            auditLogService.log(
                    "LOGIN",
                    user.getId(),
                    "User logged in"
            );

            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setUserId(user.getId());
            response.setName(user.getName());
            response.setEmail(user.getEmail());

            String roleName = user.getRoles().stream()
                    .findFirst()
                    .map(role -> role.getName())
                    .orElse("ROLE_VICTIM");

            response.setRole(roleName);

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }
    }
}