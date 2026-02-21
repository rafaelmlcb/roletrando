package com.rafael.resource;

import com.rafael.model.RoomManager;
import com.rafael.service.StatsService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;

@Path("/api/stats")
@Produces(MediaType.APPLICATION_JSON)
public class StatsResource {

    @Inject
    StatsService statsService;

    @Inject
    RoomManager roomManager;

    @GET
    public Response getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("onlinePlayers", roomManager.getOnlinePlayersCount());
        stats.put("activeRooms", roomManager.getActiveRoomsCount());
        stats.put("requestsProcessed", statsService.getRequestCount());
        stats.put("uptime", statsService.getUptime());
        stats.put("gamesCreated", statsService.getTotalGamesCreated());

        return Response.ok(stats).build();
    }
}
