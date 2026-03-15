package com.resolveitbackend.resolveit.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private String role;
}