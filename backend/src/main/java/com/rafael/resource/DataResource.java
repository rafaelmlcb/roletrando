package com.rafael.resource;

import com.rafael.model.MillionaireQuestion;
import com.rafael.model.QuizQuestion;
import com.rafael.model.dto.SecureMillionaireQuestion;
import com.rafael.model.dto.SecureQuizQuestion;
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
import java.util.stream.Collectors;

@Path("/api/data")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DataResource {

    private static final Logger LOG = Logger.getLogger(DataResource.class);

    @Inject
    DataLoaderService dataLoader;

    // --- Millionaire Endpoints ---

    @GET
    @Path("/millionaire/questions")
    public Response getMillionaireQuestions() {
        List<MillionaireQuestion> all = dataLoader.getMillionaireQuestions();
        if (all == null || all.isEmpty())
            return Response.status(Response.Status.NOT_FOUND).build();

        List<SecureMillionaireQuestion> secureList = all.stream()
                .map(q -> new SecureMillionaireQuestion(q.question, q.options))
                .collect(Collectors.toList());
        return Response.ok(secureList).build();
    }

    public static class AnswerRequest {
        public int answerIndex;
    }

    @POST
    @Path("/millionaire/answer/{questionIndex}")
    public Response checkMillionaireAnswer(@PathParam("questionIndex") int questionIndex, AnswerRequest request) {
        List<MillionaireQuestion> all = dataLoader.getMillionaireQuestions();
        if (all == null || questionIndex < 0 || questionIndex >= all.size()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        MillionaireQuestion q = all.get(questionIndex);
        boolean correct = (q.answer == request.answerIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("correct", correct);
        response.put("correctAnswerIndex", q.answer); // Client will now know it since it submitted

        return Response.ok(response).build();
    }

    @GET
    @Path("/millionaire/lifeline/fiftyfifty/{questionIndex}")
    public Response getFiftyFifty(@PathParam("questionIndex") int questionIndex) {
        List<MillionaireQuestion> all = dataLoader.getMillionaireQuestions();
        if (all == null || questionIndex < 0 || questionIndex >= all.size()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        MillionaireQuestion q = all.get(questionIndex);
        int correctAnswer = q.answer;

        List<Integer> wrongAnswers = new ArrayList<>();
        for (int i = 0; i < q.options.size(); i++) {
            if (i != correctAnswer)
                wrongAnswers.add(i);
        }

        List<Integer> toHide = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            int randomIndex = (int) (Math.random() * wrongAnswers.size());
            toHide.add(wrongAnswers.remove(randomIndex));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("hiddenOptions", toHide);
        return Response.ok(response).build();
    }

    @GET
    @Path("/millionaire/lifeline/audience/{questionIndex}")
    public Response getAudience(@PathParam("questionIndex") int questionIndex) {
        List<MillionaireQuestion> all = dataLoader.getMillionaireQuestions();
        if (all == null || questionIndex < 0 || questionIndex >= all.size()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        MillionaireQuestion q = all.get(questionIndex);
        int correctAnswer = q.answer;

        int[] data = new int[4];
        int remaining = 100;
        int correctWeight = 50 + (int) (Math.random() * 30);
        data[correctAnswer] = correctWeight;
        remaining -= correctWeight;

        List<Integer> wrongIndices = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            if (i != correctAnswer)
                wrongIndices.add(i);
        }

        for (int i = 0; i < wrongIndices.size(); i++) {
            if (i == 2) {
                data[wrongIndices.get(i)] = remaining;
            } else {
                int val = (int) (Math.random() * remaining);
                data[wrongIndices.get(i)] = val;
                remaining -= val;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("audienceData", data);
        return Response.ok(response).build();
    }

    // --- Quiz Endpoints ---

    @GET
    @Path("/quiz/questions")
    public Response getQuizQuestions() {
        List<QuizQuestion> all = dataLoader.getQuizQuestions();
        if (all == null || all.isEmpty())
            return Response.status(Response.Status.NOT_FOUND).build();

        List<SecureQuizQuestion> secureList = all.stream()
                .map(q -> new SecureQuizQuestion(q.id, q.question, q.options))
                .collect(Collectors.toList());
        return Response.ok(secureList).build();
    }

    @POST
    @Path("/quiz/answer/{questionIndex}")
    public Response checkQuizAnswer(@PathParam("questionIndex") int questionIndex, AnswerRequest request) {
        List<QuizQuestion> all = dataLoader.getQuizQuestions();
        if (all == null || questionIndex < 0 || questionIndex >= all.size()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        QuizQuestion q = all.get(questionIndex);
        boolean correct = (q.answer == request.answerIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("correct", correct);
        response.put("correctAnswerIndex", q.answer);

        return Response.ok(response).build();
    }
}
