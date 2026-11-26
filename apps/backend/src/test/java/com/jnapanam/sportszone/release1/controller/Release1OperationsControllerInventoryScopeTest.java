package com.jnapanam.sportszone.release1.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.jnapanam.sportszone.admin.service.OperatorAssignmentService;
import com.jnapanam.sportszone.common.exception.NotFoundException;
import com.jnapanam.sportszone.release1.service.Release1OperationsService;
import com.jnapanam.sportszone.tournament.dto.TournamentResponse;
import com.jnapanam.sportszone.tournament.service.TournamentService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

class Release1OperationsControllerInventoryScopeTest {
    private final Release1OperationsService service = mock(Release1OperationsService.class);
    private final OperatorAssignmentService assignments = mock(OperatorAssignmentService.class);
    private final TournamentService tournaments = mock(TournamentService.class);
    private final Release1OperationsController controller =
            new Release1OperationsController(service, assignments, tournaments);
    private final UUID operatorId = UUID.randomUUID();
    private final UUID assignedFacilityId = UUID.randomUUID();
    private final Authentication authentication = mock(Authentication.class);

    @Test
    void organizerCannotUpdateStandingsForTournamentTheyDoNotManage() {
        UUID tournamentId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(operatorId.toString());
        when(assignments.isAdministratorActor(operatorId)).thenReturn(false);
        when(tournaments.managedBy(operatorId)).thenReturn(List.of());

        assertThrows(NotFoundException.class, () -> controller.standing(authentication, tournamentId, teamId,
                Map.of("played", 1, "won", 1, "drawn", 0, "lost", 0, "points", 3,
                        "scoreFor", 2, "scoreAgainst", 0)));
        verifyNoInteractions(service);
    }

    @Test
    void organizerCanUpdateStandingsForOwnedTournament() {
        UUID tournamentId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(operatorId.toString());
        when(assignments.isAdministratorActor(operatorId)).thenReturn(false);
        when(tournaments.managedBy(operatorId)).thenReturn(List.of(new TournamentResponse(
                tournamentId, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, null)));

        controller.standing(authentication, tournamentId, teamId,
                Map.of("played", 1, "won", 1, "drawn", 0, "lost", 0, "points", 3,
                        "scoreFor", 2, "scoreAgainst", 0));

        verify(service).standing(tournamentId, teamId, 1, 1, 0, 0, 3, 2, 0, 0.0);
    }

    @Test
    void administratorCanUpdateStandingsForAnyTournament() {
        UUID tournamentId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(operatorId.toString());
        when(assignments.isAdministratorActor(operatorId)).thenReturn(true);

        controller.standing(authentication, tournamentId, teamId,
                Map.of("played", 1, "won", 1, "drawn", 0, "lost", 0, "points", 3,
                        "scoreFor", 2, "scoreAgainst", 0));

        verifyNoInteractions(tournaments);
        verify(service).standing(tournamentId, teamId, 1, 1, 0, 0, 3, 2, 0, 0.0);
    }

    @Test
    void operatorInventoryIsFilteredToAssignedFacilities() {
        when(authentication.getName()).thenReturn(operatorId.toString());
        when(assignments.isAdministratorActor(operatorId)).thenReturn(false);
        when(assignments.facilitiesForActor(operatorId)).thenReturn(
                List.of(Map.of("facilityId", assignedFacilityId)));
        List<Map<String, Object>> expected = List.of(Map.of("equipmentName", "Badminton racket"));
        when(service.inventoryForFacilities(List.of(assignedFacilityId))).thenReturn(expected);

        assertEquals(expected, controller.inventory(authentication));
        verify(service).inventoryForFacilities(List.of(assignedFacilityId));
        verify(service, never()).inventory();
    }

    @Test
    void operatorCannotCreateGlobalInventoryWithoutFacility() {
        when(authentication.getName()).thenReturn(operatorId.toString());
        when(assignments.isAdministratorActor(operatorId)).thenReturn(false);

        assertThrows(NotFoundException.class,
                () -> controller.inventory(authentication, Map.of("equipmentName", "Shuttlecock",
                        "totalQuantity", 20)));
        verifyNoInteractions(service);
        verify(assignments, never()).assertFacilityAllowed(any(), any());
    }

    @Test
    void operatorCannotCreateInventoryForUnassignedFacility() {
        when(authentication.getName()).thenReturn(operatorId.toString());
        when(assignments.isAdministratorActor(operatorId)).thenReturn(false);
        doThrow(new NotFoundException("Facility not found"))
                .when(assignments).assertFacilityAllowed(operatorId, assignedFacilityId);

        assertThrows(NotFoundException.class,
                () -> controller.inventory(authentication, Map.of("facilityId", assignedFacilityId.toString(),
                        "equipmentName", "Shuttlecock", "totalQuantity", 20)));
        verifyNoInteractions(service);
    }

    @Test
    void administratorCanManageGlobalInventory() {
        when(authentication.getName()).thenReturn(operatorId.toString());
        when(assignments.isAdministratorActor(operatorId)).thenReturn(true);
        Map<String, Object> expected = Map.of("equipmentName", "General stock");
        when(service.inventory(null, "General stock", 10, 0L)).thenReturn(expected);

        assertEquals(expected, controller.inventory(authentication,
                Map.of("equipmentName", "General stock", "totalQuantity", 10)));
        verify(assignments, never()).assertFacilityAllowed(any(), any());
    }
}
