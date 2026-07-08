package com.learntrack.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebMvcConfig — Configures resource handlers for serving uploaded files.
 * 
 * Maps requests to /api/files/** to the local filesystem directory
 * where uploaded attachments are stored.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uriPath = java.nio.file.Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        // toUri() on a directory may or may not have a trailing slash depending on if it exists.
        // Spring requires a trailing slash for directory locations.
        if (!uriPath.endsWith("/")) {
            uriPath += "/";
        }
        registry.addResourceHandler("/api/files/**")
                .addResourceLocations(uriPath);
    }
}
