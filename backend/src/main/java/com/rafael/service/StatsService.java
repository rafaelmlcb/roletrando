package com.rafael.service;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

@ApplicationScoped
public class StatsService {
    private final Instant startTime = Instant.now();
    private final AtomicLong requestCounter = new AtomicLong(0);
    private final AtomicLong totalGamesCreated = new AtomicLong(0);

    public void incrementRequestCount() {
        requestCounter.incrementAndGet();
    }

    public void incrementGamesCreated() {
        totalGamesCreated.incrementAndGet();
    }

    public long getRequestCount() {
        return requestCounter.get();
    }

    public long getTotalGamesCreated() {
        return totalGamesCreated.get();
    }

    public String getUptime() {
        Duration duration = Duration.between(startTime, Instant.now());
        long days = duration.toDays();
        long hours = duration.toHoursPart();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();
        return String.format("%dd %dh %dm %ds", days, hours, minutes, seconds);
    }
}
