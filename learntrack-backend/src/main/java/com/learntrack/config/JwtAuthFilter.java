package com.learntrack.config;

import com.learntrack.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtAuthFilter — JWT Authentication Filter.
 * 
 * This filter intercepts every HTTP request and:
 * 1. Reads the Authorization header
 * 2. Extracts and validates the JWT token
 * 3. If valid, sets the authenticated user in the Spring Security context
 * 4. If invalid or missing, the request continues without authentication
 *    (Spring Security will handle rejection for protected endpoints)
 * 
 * PRD Reference: Section 6.5
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Step 1: Get the Authorization header
        final String authHeader = request.getHeader("Authorization");

        // Step 2: Check if the header contains a Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // No token found — continue without authentication
            filterChain.doFilter(request, response);
            return;
        }

        // Step 3: Extract the token (remove "Bearer " prefix)
        final String jwt = authHeader.substring(7);

        try {
            // Step 4: Extract the username from the token
            final String username = jwtUtil.extractUsername(jwt);

            // Step 5: If username exists and no authentication is set yet
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Step 6: Load the user details from the database
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Step 7: Validate the token
                if (jwtUtil.isTokenValid(jwt, userDetails)) {

                    // Step 8: Create authentication token and set it in the security context
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token is invalid or expired — continue without authentication
            // Spring Security will reject the request if the endpoint is protected
        }

        // Continue the filter chain
        filterChain.doFilter(request, response);
    }
}
