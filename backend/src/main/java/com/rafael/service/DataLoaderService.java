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

import java.io.InputStream;
import java.util.*;

@ApplicationScoped
public class DataLoaderService {

    private static final Logger LOG = Logger.getLogger(DataLoaderService.class);

    @ConfigProperty(name = "game.theme", defaultValue = "default")
    String defaultTheme;

    @Inject
    ObjectMapper mapper;

    private final Map<String, ThemeData> themeCache = new LinkedHashMap<>();

    public static class ThemeData {
        public List<WheelPhrase> wheelPhrases = new ArrayList<>();
        public List<MillionaireLevel> millionaireLevels = new ArrayList<>();
        public List<QuizLevel> quizLevels = new ArrayList<>();
    }

    void onStart(@Observes StartupEvent ev) {
        LOG.infof("Scanning game themes in data/...");
        List<String> themes = discoverThemes();
        // Load default first so other themes can fall back to it
        if (themes.contains("default")) {
            themeCache.put("default", loadTheme("default"));
        }
        for (String theme : themes) {
            if (!theme.equals("default")) {
                themeCache.put(theme, loadTheme(theme));
            }
        }
        // Ensure default is always present
        themeCache.putIfAbsent("default", new ThemeData());
        LOG.infof("Loaded %d theme(s): %s", themeCache.size(), themeCache.keySet());
    }

    private List<String> discoverThemes() {
        List<String> themes = new ArrayList<>();
        try {
            URL dataUrl = Thread.currentThread().getContextClassLoader().getResource("data");
            if (dataUrl != null) {
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
            if (is == null || is.available() == 0) {
                LOG.warnf("[%s] wheel.json not found or empty.", theme);
                return new ArrayList<>();
            }
            List<WheelPhrase> list = mapper.readValue(is, new TypeReference<List<WheelPhrase>>() {
            });
            LOG.infof("[%s] Loaded %d wheel phrases.", theme, list.size());
            return list;
        } catch (Exception e) {
            LOG.warnf("[%s] Failed to load wheel.json: %s", theme, e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<MillionaireLevel> loadMillionaireData(String theme) {
        String path = "data/" + theme + "/millionaire.json";
        try (InputStream is = stream(path)) {
            if (is == null || is.available() == 0) {
                LOG.warnf("[%s] millionaire.json not found or empty — will use default fallback.", theme);
                return new ArrayList<>();
            }
            MillionaireData data = mapper.readValue(is, MillionaireData.class);
            LOG.infof("[%s] Loaded %d millionaire levels.", theme, data.levels.size());
            return data.levels;
        } catch (Exception e) {
            LOG.warnf("[%s] Failed to load millionaire.json: %s — will use default fallback.", theme, e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<QuizLevel> loadQuizData(String theme) {
        String path = "data/" + theme + "/quiz.json";
        try (InputStream is = stream(path)) {
            if (is == null || is.available() == 0) {
                LOG.warnf("[%s] quiz.json not found or empty — will use default fallback.", theme);
                return new ArrayList<>();
            }
            QuizData data = mapper.readValue(is, QuizData.class);
            LOG.infof("[%s] Loaded %d quiz levels.", theme, data.levels.size());
            return data.levels;
        } catch (Exception e) {
            LOG.warnf("[%s] Failed to load quiz.json: %s — will use default fallback.", theme, e.getMessage());
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

    /**
     * Resolve a theme with per-field fallback to default when data is missing.
     * e.g.: jatai has wheel but no millionaire → millionaire falls back to default.
     */
    private ThemeData resolve(String theme) {
        ThemeData requested = themeCache.get(theme);
        ThemeData fallback = themeCache.getOrDefault("default", new ThemeData());

        if (requested == null) {
            LOG.warnf("Theme '%s' not found in cache, using default.", theme);
            return fallback;
        }

        // Field-level fallback: if a specific data type is missing, use default
        ThemeData result = new ThemeData();
        result.wheelPhrases = (requested.wheelPhrases == null || requested.wheelPhrases.isEmpty())
                ? fallback.wheelPhrases
                : requested.wheelPhrases;
        result.millionaireLevels = (requested.millionaireLevels == null || requested.millionaireLevels.isEmpty())
                ? fallback.millionaireLevels
                : requested.millionaireLevels;
        result.quizLevels = (requested.quizLevels == null || requested.quizLevels.isEmpty())
                ? fallback.quizLevels
                : requested.quizLevels;
        return result;
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

    // No-arg versions use configured default
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
