package com.rafael.resource;

import com.rafael.model.GameEngine;
import com.rafael.model.GameSession;
import com.rafael.model.GameStore;
import org.jboss.logging.Logger;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * REST Resource for managing game operations.
 * Handles game creation, player guesses, and wheel spin synchronization.
 */
@Path("/api/game")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GameResource {

    private static final Logger LOG = Logger.getLogger(GameResource.class);

    @Inject
    GameEngine engine;

    /**
     * Resets the game state and starts a new session.
     * 
     * @return A new GameSession object.
     */
    @GET
    @Path("/new")
    public Response newGame() {
        LOG.info("Starting a new game session");
        GameSession session = engine.startNewGame();
        GameStore.sessions.put(session.id, session);
        LOG.infof("New game created with ID: %s, Category: %s", session.id, session.category);
        return Response.ok(session).build();
    }

    /**
     * Processes a letter guess for a specific game session.
     * 
     * @param id     The session unique identifier.
     * @param letter The character guessed by the player.
     * @return The updated GameSession state.
     */
    @POST
    @Path("/{id}/guess")
    public Response guess(@PathParam("id") String id, @QueryParam("letter") char letter) {
        LOG.infof("Processing guess '%s' for session: %s", letter, id);
        GameSession session = engine.processGuess(id, letter);
        if (session == null) {
            LOG.warnf("Session %s not found for guess", id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        LOG.infof("Guess result: %s. New Score: %d", session.message, session.score);
        return Response.ok(session).build();
    }

    /**
     * Synchronizes the wheel spin result from the client to the server state.
     * 
     * @param id    The session identifier.
     * @param value The points value landed on the wheel (0 for bankrupt).
     * @return The updated GameSession.
     */
    @POST
    @Path("/{id}/spin")
    public Response spin(@PathParam("id") String id, @QueryParam("value") int value) {
        LOG.infof("Synchronizing spin value %d for session: %s", value, id);
        GameSession session = GameStore.sessions.get(id);
        if (session == null) {
            LOG.warnf("Session %s not found for spin sync", id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (value == 0) {
            session.score = 0;
            session.currentSpinValue = 0;
            session.message = "Que azar! Perdeu tudo!";
            LOG.info("Player hit bankrupt (Perdeu Tudo). Score reset.");
        } else {
            session.currentSpinValue = value;
            session.message = "A roleta parou em " + value + " pontos! Escolha uma letra.";
            LOG.infof("Spin value %d stored for next guess", value);
        }
        return Response.ok(session).build();
    }

    /**
     * Attempts to solve the entire phrase at once.
     * 
     * @param id     The session identifier.
     * @param phrase The full phrase being guessed.
     * @return Updated GameSession with results.
     */
    @POST
    @Path("/{id}/solve")
    public Response solve(@PathParam("id") String id, @QueryParam("phrase") String phrase) {
        LOG.infof("Attempting to solve session %s with phrase: %s", id, phrase);
        GameSession session = engine.solve(id, phrase);
        if (session == null) {
            LOG.warnf("Session %s not found for solve attempt", id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        LOG.info("Solve attempt processed.");
        return Response.ok(session).build();
    }
}
