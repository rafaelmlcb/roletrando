package com.rafael.resource;

import com.rafael.service.GameHistoryService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/ranking")
@Produces(MediaType.APPLICATION_JSON)
public class RankingResource {

    @Inject
    GameHistoryService historyService;

    /**
     * Returns the aggregated player ranking sorted by total score descending.
     */
    @GET
    public Response getRanking() {
        return Response.ok(historyService.getRanking()).build();
    }
}
