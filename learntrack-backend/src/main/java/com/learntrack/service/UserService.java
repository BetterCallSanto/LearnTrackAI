package com.learntrack.service;

import com.learntrack.dao.UserDAO;
import com.learntrack.dto.AuthResponse;
import com.learntrack.dto.LoginRequest;
import com.learntrack.dto.RegisterRequest;
import com.learntrack.exception.BadRequestException;
import com.learntrack.model.User;
import com.learntrack.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * UserService — Business logic for user authentication and management.
 * 
 * Handles:
 * - User registration (with duplicate checks and password hashing)
 * - User login (with JWT token generation)
 * - Loading user details for Spring Security
 * 
 * This service calls the UserDAO for all database operations.
 * Never calls the Repository directly (DAO pattern enforced).
 * 
 * PRD Reference: Section 6.2, 6.3
 */
@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserDAO userDAO;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    /**
     * Register a new user.
     * 
     * Flow (per PRD §6.2):
     * 1. Check if username already exists → 400 if duplicate
     * 2. Check if email already exists → 400 if duplicate
     * 3. Hash the password using BCrypt
     * 4. Save the new user via DAO
     * 5. Return success message
     */
    public String register(RegisterRequest request) {
        // Check for duplicate username
        if (userDAO.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }

        // Check for duplicate email
        if (userDAO.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        // Create new User entity with hashed password
        User user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        // Save via DAO
        userDAO.saveUser(user);

        return "User registered successfully";
    }

    /**
     * Authenticate a user and return a JWT token.
     * 
     * Flow (per PRD §6.3):
     * 1. Authenticate credentials via Spring Security AuthenticationManager
     * 2. If credentials are wrong → 401 Unauthorized (handled by global exception handler)
     * 3. If correct, generate a signed JWT token
     * 4. Return AuthResponse with token, username, userId
     */
    public AuthResponse login(LoginRequest request) {
        // Authenticate using Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // Load the authenticated user
        User user = (User) authentication.getPrincipal();

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getUsername(), user.getId());

        // Return response with token and user info
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .userId(user.getId())
                .fullName(user.getFullName())
                .build();
    }

    /**
     * Load a user by username — required by Spring Security's UserDetailsService.
     * Called internally by the JwtAuthFilter during token validation.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userDAO.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    /**
     * Find a user by their ID.
     */
    public User findById(Long userId) {
        return userDAO.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + userId));
    }
}
