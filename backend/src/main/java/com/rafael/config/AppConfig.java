package com.rafael.config;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import io.quarkus.runtime.StartupEvent;
import org.jboss.logging.Logger;

@ApplicationScoped
public class AppConfig {
    private static final Logger LOGGER = Logger.getLogger(AppConfig.class);

    void onStart(@Observes StartupEvent ev) {
        LOGGER.info("The application is starting...");
    }
}
