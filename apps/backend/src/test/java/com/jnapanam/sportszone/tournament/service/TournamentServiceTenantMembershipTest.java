package com.jnapanam.sportszone.tournament.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.jnapanam.sportszone.catalog.model.Sport;
import com.jnapanam.sportszone.catalog.repository.FacilityRepository;
import com.jnapanam.sportszone.catalog.repository.SportRepository;
import com.jnapanam.sportszone.common.exception.ConflictException;
import com.jnapanam.sportszone.identity.model.Role;
import com.jnapanam.sportszone.identity.model.RoleName;
import com.jnapanam.sportszone.identity.model.User;
import com.jnapanam.sportszone.identity.repository.RoleRepository;
import com.jnapanam.sportszone.identity.repository.UserRepository;
import com.jnapanam.sportszone.notification.service.NotificationService;
import com.jnapanam.sportszone.tenancy.TenantContext;
import com.jnapanam.sportszone.tenancy.TenantContextHolder;
import com.jnapanam.sportszone.tournament.dto.TournamentRequest;
import com.jnapanam.sportszone.tournament.model.TeamStatus;
import com.jnapanam.sportszone.tournament.model.Tournament;
import com.jnapanam.sportszone.tournament.model.TournamentFormat;
import com.jnapanam.sportszone.tournament.repository.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class TournamentServiceTenantMembershipTest {
    private final OrganizerApplicationRepository applications = mock(OrganizerApplicationRepository.class);
    private final TournamentRepository tournaments = mock(TournamentRepository.class);
    private final TournamentTeamRepository teams = mock(TournamentTeamRepository.class);
    private final TournamentTeamMemberRepository members = mock(TournamentTeamMemberRepository.class);
    private final TournamentFixtureRepository fixtures = mock(TournamentFixtureRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final RoleRepository roles = mock(RoleRepository.class);
    private final SportRepository sports = mock(SportRepository.class);
    private final FacilityRepository facilities = mock(FacilityRepository.class);
    private final NotificationService notifications = mock(NotificationService.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);

    private final UUID tenantId = UUID.randomUUID();
    private final UUID organizerId = UUID.randomUUID();
    private final User organizer = mock(User.class);
    private final Sport sport = mock(Sport.class);
    private final Role globalOrganizerRole = mock(Role.class);
    private TournamentService service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
        service = new TournamentService(applications, tournaments, teams, members, fixtures, users, roles,
                sports, facilities, notifications, jdbc, 15);
        when(users.findById(organizerId)).thenReturn(Optional.of(organizer));
        when(organizer.getId()).thenReturn(organizerId);
        when(organizer.getFullName()).thenReturn("Organizer");
        when(sport.getCode()).thenReturn("BADMINTON");
        when(sports.findByCodeIgnoreCase("BADMINTON")).thenReturn(Optional.of(sport));
        when(tournaments.existsByCodeIgnoreCase("CUP-2026")).thenReturn(false);
        when(tournaments.save(any(Tournament.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(teams.countByTournamentIdAndStatus(any(UUID.class), eq(TeamStatus.REGISTERED))).thenReturn(0L);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void activeTenantOrganizerMembershipCanCreateTournamentWithoutGlobalOrganizerRole() {
        TenantContextHolder.set(new TenantContext(tenantId, "arena-one", "Arena One", "CUSTOMER_HOSTED"));
        when(jdbc.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(1);

        var created = service.createByOrganizer(organizerId, request());

        assertThat(created.id()).isNotNull();
        assertThat(created.organizerName()).isEqualTo("Organizer");
        verify(applications, never()).existsByUserIdAndStatus(organizerId,
                com.jnapanam.sportszone.tournament.model.OrganizerStatus.APPROVED);
    }

    @Test
    void globalOrganizerRoleAndApprovalCannotBypassMissingTenantMembership() {
        TenantContextHolder.set(new TenantContext(tenantId, "arena-one", "Arena One", "CUSTOMER_HOSTED"));
        when(globalOrganizerRole.getName()).thenReturn(RoleName.ORGANIZER);
        when(organizer.getRoles()).thenReturn(Set.of(globalOrganizerRole));
        when(applications.existsByUserIdAndStatus(organizerId,
                com.jnapanam.sportszone.tournament.model.OrganizerStatus.APPROVED)).thenReturn(true);
        when(jdbc.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(0);

        assertThrows(ConflictException.class, () -> service.createByOrganizer(organizerId, request()));

        verify(applications, never()).existsByUserIdAndStatus(organizerId,
                com.jnapanam.sportszone.tournament.model.OrganizerStatus.APPROVED);
        verifyNoInteractions(tournaments, sports);
    }

    private TournamentRequest request() {
        return new TournamentRequest("CUP-2026", "PlayNexa Cup", null, "BADMINTON", organizerId,
                TournamentFormat.LEAGUE, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 5),
                LocalDate.of(2026, 12, 6), LocalDate.of(2026, 12, 7), 2, 8, BigDecimal.ZERO);
    }
}
