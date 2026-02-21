package com.rafael.config;

import com.rafael.service.StatsService;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
public class RequestCounterFilter implements ContainerRequestFilter {

    @Inject
    StatsService statsService;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        // Increment count for every API request
        statsService.incrementRequestCount();
    }
}
