package com.rafael.resource;

import com.rafael.model.MillionaireLevel;
import com.rafael.model.MillionaireQuestion;
import com.rafael.model.QuizLevel;
import com.rafael.model.QuizQuestion;
import com.rafael.service.DataLoaderService;
import org.jboss.logging.Logger;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Path("/api/data")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DataResource {

    private static final Logger LOG = Logger.getLogger(DataResource.class);
    private static final Random RANDOM = new Random();

    @Inject
    DataLoaderService dataLoader;

    // ============================================================
    // THEME DISCOVERY ENDPOINT
    // ============================================================

    @GET
    @Path("/themes")
    public Response getThemes() {
        Map<String, Object> response = new HashMap<>();
        response.put("themes", dataLoader.getAvailableThemes());
        response.put("defaultTheme", dataLoader.getDefaultTheme());
        return Response.ok(response).build();
    }

    // ============================================================
    // MILLIONAIRE ENDPOINTS
    // ============================================================

    @GET
    @Path("/millionaire/questions")
    public Response getMillionaireQuestions(@QueryParam("theme") String theme) {
        String t = resolveTheme(theme);
        List<MillionaireLevel> levels = dataLoader.getMillionaireLevels(t);
        if (levels == null || levels.isEmpty())
            return Response.status(Response.Status.NOT_FOUND).build();

        List<Map<String, Object>> result = new ArrayList<>();
        for (MillionaireLevel level : levels) {
            if (level.questions == null || level.questions.isEmpty())
                continue;
            int questionIndex = RANDOM.nextInt(level.questions.size());
            MillionaireQuestion q = level.questions.get(questionIndex);
            Map<String, Object> item = new HashMap<>();
            item.put("level", level.level);
            item.put("prize", level.prize);
            item.put("question", q.question);
            item.put("options", q.options);
            item.put("questionIndex", questionIndex);
            result.add(item);
        }
        return Response.ok(result).build();
    }

    public static class AnswerRequest {
        public int answerIndex;
    }

    @POST
    @Path("/millionaire/answer/{level}/{questionIndex}")
    public Response checkMillionaireAnswer(
            @PathParam("level") int level,
            @PathParam("questionIndex") int questionIndex,
            @QueryParam("theme") String theme,
            AnswerRequest request) {

        MillionaireQuestion q = getMillionaireQuestion(resolveTheme(theme), level, questionIndex);
        if (q == null)
            return Response.status(Response.Status.BAD_REQUEST).build();

        boolean correct = (q.answer == request.answerIndex);
        Map<String, Object> response = new HashMap<>();
        response.put("correct", correct);
        response.put("correctAnswerIndex", q.answer);
        return Response.ok(response).build();
    }

    @GET
    @Path("/millionaire/lifeline/fiftyfifty/{level}/{questionIndex}")
    public Response getFiftyFifty(
            @PathParam("level") int level,
            @PathParam("questionIndex") int questionIndex,
            @QueryParam("theme") String theme) {

        MillionaireQuestion q = getMillionaireQuestion(resolveTheme(theme), level, questionIndex);
        if (q == null)
            return Response.status(Response.Status.BAD_REQUEST).build();

        List<Integer> wrongAnswers = new ArrayList<>();
        for (int i = 0; i < q.options.size(); i++) {
            if (i != q.answer)
                wrongAnswers.add(i);
        }
        List<Integer> toHide = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            toHide.add(wrongAnswers.remove(RANDOM.nextInt(wrongAnswers.size())));
        }
        Map<String, Object> response = new HashMap<>();
        response.put("hiddenOptions", toHide);
        return Response.ok(response).build();
    }

    @GET
    @Path("/millionaire/lifeline/audience/{level}/{questionIndex}")
    public Response getAudience(
            @PathParam("level") int level,
            @PathParam("questionIndex") int questionIndex,
            @QueryParam("theme") String theme) {

        MillionaireQuestion q = getMillionaireQuestion(resolveTheme(theme), level, questionIndex);
        if (q == null)
            return Response.status(Response.Status.BAD_REQUEST).build();

        List<Integer> data = new ArrayList<>(List.of(0, 0, 0, 0));
        int remaining = 100;
        int correctWeight = 50 + RANDOM.nextInt(30);
        data.set(q.answer, correctWeight);
        remaining -= correctWeight;

        List<Integer> wrongIndices = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            if (i != q.answer)
                wrongIndices.add(i);
        }
        for (int i = 0; i < wrongIndices.size(); i++) {
            if (i == wrongIndices.size() - 1) {
                data.set(wrongIndices.get(i), remaining);
            } else {
                int val = remaining > 0 ? RANDOM.nextInt(remaining) : 0;
                data.set(wrongIndices.get(i), val);
                remaining -= val;
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("audienceData", data);
        return Response.ok(response).build();
    }

    @GET
    @Path("/millionaire/skip/{level}")
    public Response skipMillionaireQuestion(
            @PathParam("level") int level,
            @QueryParam("excludeIndex") int excludeIndex,
            @QueryParam("theme") String theme) {

        String t = resolveTheme(theme);
        List<MillionaireLevel> levels = dataLoader.getMillionaireLevels(t);
        if (levels == null)
            return Response.status(Response.Status.NOT_FOUND).build();

        MillionaireLevel foundLevel = levels.stream().filter(l -> l.level == level).findFirst().orElse(null);
        if (foundLevel == null || foundLevel.questions.size() <= 1)
            return Response.status(Response.Status.BAD_REQUEST).build();

        int newIndex;
        int attempts = 0;
        do {
            newIndex = RANDOM.nextInt(foundLevel.questions.size());
            attempts++;
        } while (newIndex == excludeIndex && attempts < 20);

        MillionaireQuestion q = foundLevel.questions.get(newIndex);
        Map<String, Object> result = new HashMap<>();
        result.put("question", q.question);
        result.put("options", q.options);
        result.put("questionIndex", newIndex);
        result.put("level", foundLevel.level);
        result.put("prize", foundLevel.prize);
        return Response.ok(result).build();
    }

    // ============================================================
    // QUIZ ENDPOINTS
    // ============================================================

    @GET
    @Path("/quiz/questions")
    public Response getQuizQuestions(@QueryParam("theme") String theme) {
        String t = resolveTheme(theme);
        List<QuizLevel> levels = dataLoader.getQuizLevels(t);
        if (levels == null || levels.isEmpty())
            return Response.status(Response.Status.NOT_FOUND).build();

        List<Map<String, Object>> result = new ArrayList<>();
        for (QuizLevel level : levels) {
            if (level.questions == null || level.questions.isEmpty())
                continue;
            int questionIndex = RANDOM.nextInt(level.questions.size());
            QuizQuestion q = level.questions.get(questionIndex);
            Map<String, Object> item = new HashMap<>();
            item.put("level", level.level);
            item.put("label", level.label);
            item.put("question", q.question);
            item.put("options", q.options);
            item.put("questionIndex", questionIndex);
            result.add(item);
        }
        return Response.ok(result).build();
    }

    @POST
    @Path("/quiz/answer/{level}/{questionIndex}")
    public Response checkQuizAnswer(
            @PathParam("level") int level,
            @PathParam("questionIndex") int questionIndex,
            @QueryParam("theme") String theme,
            AnswerRequest request) {

        QuizQuestion q = getQuizQuestion(resolveTheme(theme), level, questionIndex);
        if (q == null)
            return Response.status(Response.Status.BAD_REQUEST).build();

        boolean correct = (q.answer == request.answerIndex);
        Map<String, Object> response = new HashMap<>();
        response.put("correct", correct);
        response.put("correctAnswerIndex", q.answer);
        return Response.ok(response).build();
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private String resolveTheme(String theme) {
        return (theme != null && !theme.isBlank()) ? theme : dataLoader.getDefaultTheme();
    }

    private MillionaireQuestion getMillionaireQuestion(String theme, int level, int questionIndex) {
        List<MillionaireLevel> levels = dataLoader.getMillionaireLevels(theme);
        if (levels == null)
            return null;
        MillionaireLevel foundLevel = levels.stream().filter(l -> l.level == level).findFirst().orElse(null);
        if (foundLevel == null || questionIndex < 0 || questionIndex >= foundLevel.questions.size())
            return null;
        return foundLevel.questions.get(questionIndex);
    }

    private QuizQuestion getQuizQuestion(String theme, int level, int questionIndex) {
        List<QuizLevel> levels = dataLoader.getQuizLevels(theme);
        if (levels == null)
            return null;
        QuizLevel foundLevel = levels.stream().filter(l -> l.level == level).findFirst().orElse(null);
        if (foundLevel == null || questionIndex < 0 || questionIndex >= foundLevel.questions.size())
            return null;
        return foundLevel.questions.get(questionIndex);
    }
}
