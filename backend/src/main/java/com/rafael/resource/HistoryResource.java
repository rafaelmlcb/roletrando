package com.rafael.resource;

import com.rafael.service.GameHistoryService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api/history")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class HistoryResource {

    @Inject
    GameHistoryService historyService;

    /**
     * Frontend calls this endpoint when a game finishes (mainly for Millionaire).
     * Body: { "playerName": "...", "game": "...", "score": 0, "winner": true }
     */
    @POST
    @Path("/record")
    public Response record(Map<String, Object> body) {
        try {
            String playerName = (String) body.get("playerName");
            String game = (String) body.get("game");
            int score = body.get("score") instanceof Number n ? n.intValue() : 0;
            boolean winner = body.get("winner") instanceof Boolean b ? b : false;

            if (playerName == null || playerName.isBlank() || game == null || game.isBlank()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "playerName and game are required")).build();
            }
            historyService.record(playerName, game, score, winner);
            return Response.ok(Map.of("ok", true)).build();
        } catch (Exception e) {
            return Response.serverError().entity(Map.of("error", e.getMessage())).build();
        }
    }
}
