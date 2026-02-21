package com.rafael.config;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
public class SecurityHeadersFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext,
            ContainerResponseContext responseContext) throws IOException {

        // Security headers recommended by OWASP
        responseContext.getHeaders().add("X-Content-Type-Options", "nosniff");
        responseContext.getHeaders().add("X-Frame-Options", "DENY");
        responseContext.getHeaders().add("X-XSS-Protection", "1; mode=block");
        responseContext.getHeaders().add("Content-Security-Policy",
                "default-src 'self' https://api.dicebear.com; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                        "font-src 'self' https://fonts.gstatic.com; " +
                        "img-src 'self' data: https://api.dicebear.com; " +
                        "connect-src 'self' ws: wss: http://localhost:8080 http://localhost:8081;");
        responseContext.getHeaders().add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        responseContext.getHeaders().add("Referrer-Policy", "strict-origin-when-cross-origin");
    }
}
