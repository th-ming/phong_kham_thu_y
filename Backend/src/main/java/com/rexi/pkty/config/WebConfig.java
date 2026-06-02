package com.rexi.pkty.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private GlobalDataChangeInterceptor globalDataChangeInterceptor;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        Path vnuaDocDir = Paths.get("src/main/resources/knowledge/vnua_docs");
        String vnuaDocPath = vnuaDocDir.toFile().getAbsolutePath();

        registry.addResourceHandler("/uploads/**").addResourceLocations("file:" + uploadPath + "/");
        registry.addResourceHandler("/vnua-docs/**").addResourceLocations("file:" + vnuaDocPath + "/");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(globalDataChangeInterceptor).addPathPatterns("/api/**");
    }
}
