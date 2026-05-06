package com.learntrack.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JwtUtil — Utility class for JWT token operations.
 * 
 * Handles all JWT-related functionality:
 * - Generating signed tokens after successful login
 * - Extracting claims (username, user ID, expiration) from tokens
 * - Validating tokens for authenticity and expiration
 * 
 * Algorithm: HMAC-SHA256
 * Token Expiry: 24 hours (configurable via application.properties)
 * 
 * PRD Reference: Section 10.2
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    /**
     * Generate a signing key from the secret string.
     * The key must be at least 256 bits for HMAC-SHA256.
     */
    private Key getSigningKey() {
        byte[] keyBytes = secret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate a JWT token for a successfully authenticated user.
     * 
     * Token payload includes:
     * - subject: username
     * - userId: the user's database ID
     * - issuedAt: current timestamp
     * - expiration: current time + 24 hours
     * 
     * @param username The authenticated user's username
     * @param userId   The authenticated user's database ID
     * @return A signed JWT token string
     */
    public String generateToken(String username, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extract the username (subject) from a JWT token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract the user ID from a JWT token.
     */
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", Long.class);
    }

    /**
     * Extract the expiration date from a JWT token.
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extract a specific claim from a JWT token using a claims resolver function.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parse and extract all claims from a JWT token.
     * Throws an exception if the token is invalid or expired.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Check if a JWT token has expired.
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Validate a JWT token against the provided UserDetails.
     * 
     * A token is valid if:
     * 1. The username in the token matches the UserDetails username
     * 2. The token has not expired
     * 
     * @param token       The JWT token to validate
     * @param userDetails The UserDetails loaded from the database
     * @return true if the token is valid, false otherwise
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }
}
