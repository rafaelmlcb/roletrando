package com.rafael.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rafael.model.MillionaireData;
import com.rafael.model.MillionaireLevel;
import com.rafael.model.QuizQuestion;
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
    private List<QuizQuestion> quizQuestions = new ArrayList<>();

    void onStart(@Observes StartupEvent ev) {
        LOG.infof("Loading game data for theme: %s", theme);
        loadWheelPhrases();
        loadMillionaireData();
        loadQuizQuestions();
    }

    private void loadWheelPhrases() {
        String path = "data/" + theme + "/wheel.json";
        try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                LOG.warnf("File not found: %s. Using empty list.", path);
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
                LOG.warnf("File not found: %s. Using empty list.", path);
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

    private void loadQuizQuestions() {
        String path = "data/" + theme + "/quiz.json";
        try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                LOG.warnf("File not found: %s. Using empty list.", path);
                return;
            }
            quizQuestions = mapper.readValue(is, new TypeReference<List<QuizQuestion>>() {
            });
            LOG.infof("Loaded %d quiz questions.", quizQuestions.size());
        } catch (Exception e) {
            LOG.error("Failed to load quiz questions", e);
        }
    }

    public List<WheelPhrase> getWheelPhrases() {
        return wheelPhrases;
    }

    public List<MillionaireLevel> getMillionaireLevels() {
        return millionaireLevels;
    }

    public List<QuizQuestion> getQuizQuestions() {
        return quizQuestions;
    }
}
