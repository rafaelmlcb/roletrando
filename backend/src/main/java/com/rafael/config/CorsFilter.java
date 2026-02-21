package com.rafael.config;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
public class CorsFilter implements ContainerResponseFilter {

    private static final java.util.Set<String> ALLOWED_ORIGINS = java.util.Set.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "https://roletrando.vercel.app");

    @Override
    public void filter(ContainerRequestContext requestContext,
            ContainerResponseContext responseContext) throws IOException {

        String origin = requestContext.getHeaderString("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            responseContext.getHeaders().add("Access-Control-Allow-Origin", origin);
        } else if (origin == null) {
            // Optional: for non-browser requests
        }

        responseContext.getHeaders().add("Access-Control-Allow-Headers",
                "origin, content-type, accept, authorization, x-requested-with");
        responseContext.getHeaders().add("Access-Control-Allow-Credentials", "true");
        responseContext.getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");

        if (requestContext.getMethod().equalsIgnoreCase("OPTIONS")) {
            responseContext.setStatus(Response.Status.OK.getStatusCode());
        }
    }
}
