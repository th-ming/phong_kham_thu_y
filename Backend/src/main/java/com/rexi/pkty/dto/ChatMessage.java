package com.rexi.pkty.dto;

import java.util.List;

public class ChatMessage {
    private String role;
    private String content;
    private List<String> images;
    private List<String> videos;

    public ChatMessage() {
    }

    public ChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public ChatMessage(String role, String content, List<String> images, List<String> videos) {
        this.role = role;
        this.content = content;
        this.images = images;
        this.videos = videos;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<String> getVideos() {
        return videos;
    }

    public void setVideos(List<String> videos) {
        this.videos = videos;
    }
}
