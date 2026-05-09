package com.rexi.pkty.dto;

import lombok.Data;

@Data
public class GoogleAuthRequest {
    private String email;
    private String name;
    private String googleId;
    private String picture;
}

