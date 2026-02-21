package com.rafael.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rafael.model.MillionaireData;
import com.rafael.model.MillionaireLevel;
import com.rafael.model.QuizData;
import com.rafael.model.QuizLevel;
import com.rafael.model.WheelPhrase;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class DataLoaderService {

    private static final Logger LOG = Logger.getLogger(DataLoaderService.class);

    @ConfigProperty(name = "game.theme", defaultValue = "default")
    String theme;

    @Inject
    ObjectMapper mapper;

    private List<WheelPhrase> wheelPhrases = new ArrayList<>();
    private List<MillionaireLevel> millionaireLevels = new ArrayList<>();
    private List<QuizLevel> quizLevels = new ArrayList<>();

    void onStart(@Observes StartupEvent ev) {
        LOG.infof("Loading game data for theme: %s", theme);
        loadWheelPhrases();
        loadMillionaireData();
        loadQuizData();
    }

    private void loadWheelPhrases() {
        String path = "data/" + theme + "/wheel.json";
        try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                LOG.warnf("File not found: %s.", path);
                return;
            }
            wheelPhrases = mapper.readValue(is, new TypeReference<List<WheelPhrase>>() {
            });
            LOG.infof("Loaded %d wheel phrases.", wheelPhrases.size());
        } catch (Exception e) {
            LOG.error("Failed to load wheel phrases", e);
        }
    }

    private void loadMillionaireData() {
        String path = "data/" + theme + "/millionaire.json";
        try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                LOG.warnf("File not found: %s.", path);
                return;
            }
            MillionaireData data = mapper.readValue(is, MillionaireData.class);
            millionaireLevels = data.levels;
            int total = millionaireLevels.stream().mapToInt(l -> l.questions.size()).sum();
            LOG.infof("Loaded %d millionaire levels with %d total questions.", millionaireLevels.size(), total);
        } catch (Exception e) {
            LOG.error("Failed to load millionaire data", e);
        }
    }

    private void loadQuizData() {
        String path = "data/" + theme + "/quiz.json";
        try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                LOG.warnf("File not found: %s.", path);
                return;
            }
            QuizData data = mapper.readValue(is, QuizData.class);
            quizLevels = data.levels;
            int total = quizLevels.stream().mapToInt(l -> l.questions.size()).sum();
            LOG.infof("Loaded %d quiz levels with %d total questions.", quizLevels.size(), total);
        } catch (Exception e) {
            LOG.error("Failed to load quiz data", e);
        }
    }

    public List<WheelPhrase> getWheelPhrases() {
        return wheelPhrases;
    }

    public List<MillionaireLevel> getMillionaireLevels() {
        return millionaireLevels;
    }

    public List<QuizLevel> getQuizLevels() {
        return quizLevels;
    }
}
