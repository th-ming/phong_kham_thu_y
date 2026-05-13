package com.rexi.pkty.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO: Tin nh?n Chat (�� d?i t�n sang ti?ng Vi?t)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TinNhanChat {
    private String role;
    private String content;
    private String image;
    private String video;
}
