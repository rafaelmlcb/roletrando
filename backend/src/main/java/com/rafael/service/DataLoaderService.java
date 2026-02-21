package com.rafael.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rafael.model.MillionaireData;
import com.rafael.model.MillionaireLevel;
import com.rafael.model.QuizData;
import com.rafael.model.QuizLevel;
import com.rafael.model.WheelPhrase;
import com.fasterxml.jackson.core.type.TypeReference;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.*;

@ApplicationScoped
public class DataLoaderService {

    private static final Logger LOG = Logger.getLogger(DataLoaderService.class);

    @ConfigProperty(name = "game.theme", defaultValue = "default")
    String defaultTheme;

    @Inject
    ObjectMapper mapper;

    // Map<themeName, ThemeData>
    private final Map<String, ThemeData> themeCache = new LinkedHashMap<>();

    public static class ThemeData {
        public List<WheelPhrase> wheelPhrases = new ArrayList<>();
        public List<MillionaireLevel> millionaireLevels = new ArrayList<>();
        public List<QuizLevel> quizLevels = new ArrayList<>();
    }

    void onStart(@Observes StartupEvent ev) {
        LOG.infof("Scanning game themes in data/...");
        List<String> themes = discoverThemes();
        LOG.infof("Found themes: %s", themes);
        for (String theme : themes) {
            ThemeData data = loadTheme(theme);
            themeCache.put(theme, data);
        }
        // Ensure default is always present
        if (!themeCache.containsKey("default")) {
            themeCache.put("default", new ThemeData());
        }
        LOG.infof("Loaded %d theme(s): %s", themeCache.size(), themeCache.keySet());
    }

    private List<String> discoverThemes() {
        List<String> themes = new ArrayList<>();
        try {
            // Enumerate subdirectories under data/ in classpath
            URL dataUrl = Thread.currentThread().getContextClassLoader().getResource("data");
            if (dataUrl != null) {
                // Works when running from exploded classpath (dev mode)
                java.io.File dataDir = new java.io.File(dataUrl.toURI());
                if (dataDir.exists() && dataDir.isDirectory()) {
                    for (java.io.File f : Objects.requireNonNull(dataDir.listFiles())) {
                        if (f.isDirectory())
                            themes.add(f.getName());
                    }
                }
            }
        } catch (Exception e) {
            LOG.warn("Could not auto-discover themes from filesystem, using classpath probing.");
        }
        // Always try "default" as fallback
        if (themes.isEmpty())
            themes.add("default");
        Collections.sort(themes);
        return themes;
    }

    private ThemeData loadTheme(String theme) {
        ThemeData data = new ThemeData();
        data.wheelPhrases = loadWheelPhrases(theme);
        data.millionaireLevels = loadMillionaireData(theme);
        data.quizLevels = loadQuizData(theme);
        return data;
    }

    private List<WheelPhrase> loadWheelPhrases(String theme) {
        String path = "data/" + theme + "/wheel.json";
        try (InputStream is = stream(path)) {
            if (is == null) {
                LOG.warnf("Not found: %s", path);
                return new ArrayList<>();
            }
            List<WheelPhrase> list = mapper.readValue(is, new TypeReference<List<WheelPhrase>>() {
            });
            LOG.infof("[%s] Loaded %d wheel phrases.", theme, list.size());
            return list;
        } catch (Exception e) {
            LOG.errorf("Failed to load wheel for theme %s: %s", theme, e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<MillionaireLevel> loadMillionaireData(String theme) {
        String path = "data/" + theme + "/millionaire.json";
        try (InputStream is = stream(path)) {
            if (is == null) {
                LOG.warnf("Not found: %s", path);
                return new ArrayList<>();
            }
            MillionaireData data = mapper.readValue(is, MillionaireData.class);
            LOG.infof("[%s] Loaded %d millionaire levels.", theme, data.levels.size());
            return data.levels;
        } catch (Exception e) {
            LOG.errorf("Failed to load millionaire for theme %s: %s", theme, e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<QuizLevel> loadQuizData(String theme) {
        String path = "data/" + theme + "/quiz.json";
        try (InputStream is = stream(path)) {
            if (is == null) {
                LOG.warnf("Not found: %s", path);
                return new ArrayList<>();
            }
            QuizData data = mapper.readValue(is, QuizData.class);
            LOG.infof("[%s] Loaded %d quiz levels.", theme, data.levels.size());
            return data.levels;
        } catch (Exception e) {
            LOG.errorf("Failed to load quiz for theme %s: %s", theme, e.getMessage());
            return new ArrayList<>();
        }
    }

    private InputStream stream(String path) {
        return Thread.currentThread().getContextClassLoader().getResourceAsStream(path);
    }

    // ── Public API ──────────────────────────────────────────────────────────

    public List<String> getAvailableThemes() {
        return new ArrayList<>(themeCache.keySet());
    }

    public String getDefaultTheme() {
        return defaultTheme;
    }

    private ThemeData resolve(String theme) {
        ThemeData data = themeCache.get(theme);
        if (data == null) {
            LOG.warnf("Theme '%s' not found, falling back to default.", theme);
            data = themeCache.getOrDefault(defaultTheme, new ThemeData());
        }
        return data;
    }

    public List<WheelPhrase> getWheelPhrases(String theme) {
        return resolve(theme).wheelPhrases;
    }

    public List<MillionaireLevel> getMillionaireLevels(String theme) {
        return resolve(theme).millionaireLevels;
    }

    public List<QuizLevel> getQuizLevels(String theme) {
        return resolve(theme).quizLevels;
    }

    // Keep old single-theme getters that use the configured default
    public List<WheelPhrase> getWheelPhrases() {
        return getWheelPhrases(defaultTheme);
    }

    public List<MillionaireLevel> getMillionaireLevels() {
        return getMillionaireLevels(defaultTheme);
    }

    public List<QuizLevel> getQuizLevels() {
        return getQuizLevels(defaultTheme);
    }
}
