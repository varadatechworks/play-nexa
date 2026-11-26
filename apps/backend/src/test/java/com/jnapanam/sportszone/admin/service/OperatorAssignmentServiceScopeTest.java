package com.jnapanam.sportszone.admin.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.jnapanam.sportszone.catalog.repository.FacilityRepository;
import com.jnapanam.sportszone.common.exception.ConflictException;
import com.jnapanam.sportszone.common.exception.NotFoundException;
import com.jnapanam.sportszone.identity.model.Role;
import com.jnapanam.sportszone.identity.model.RoleName;
import com.jnapanam.sportszone.identity.model.User;
import com.jnapanam.sportszone.identity.repository.UserRepository;
import com.jnapanam.sportszone.tenancy.TenantContext;
import com.jnapanam.sportszone.tenancy.TenantContextHolder;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class OperatorAssignmentServiceScopeTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final UserRepository users = mock(UserRepository.class);
    private final FacilityRepository facilities = mock(FacilityRepository.class);
    private final OperatorAssignmentService service = new OperatorAssignmentService(jdbc, users, facilities);
    private final UUID actorId = UUID.randomUUID();
    private final UUID slotId = UUID.randomUUID();
    private final UUID facilityId = UUID.randomUUID();
    private final User operator = mock(User.class);
    private final Role role = mock(Role.class);

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        when(users.findById(actorId)).thenReturn(Optional.of(operator));
        when(operator.getRoles()).thenReturn(Set.of(role));
        when(role.getName()).thenReturn(RoleName.OPERATIONS);
    }

    @Test
    void operatorCannotCreateWalkInForUnassignedSlot() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(slotId), eq(actorId))).thenReturn(0);

        assertThrows(NotFoundException.class, () -> service.assertSlotAllowed(actorId, slotId));
    }

    @Test
    void operatorCanCreateWalkInForAssignedSlot() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(slotId), eq(actorId))).thenReturn(1);

        assertDoesNotThrow(() -> service.assertSlotAllowed(actorId, slotId));
    }

    @Test
    void operatorCannotCloseUnassignedFacility() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(facilityId), eq(actorId))).thenReturn(0);

        assertThrows(NotFoundException.class, () -> service.assertFacilityAllowed(actorId, facilityId));
    }

    @Test
    void operatorCanCloseAssignedFacility() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(facilityId), eq(actorId))).thenReturn(1);

        assertDoesNotThrow(() -> service.assertFacilityAllowed(actorId, facilityId));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
    }

    @Test
    void tenantScopedOperatorRoleIsHonoredEvenWhenGlobalDatabaseRoleDiffers() {
        TenantContextHolder.set(new TenantContext(UUID.randomUUID(), "arena-one", "Arena One", "CUSTOMER_HOSTED"));
        when(operator.getRoles()).thenReturn(Set.of());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                actorId.toString(), null, Set.of(new SimpleGrantedAuthority("ROLE_OPERATIONS"))));
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(slotId), eq(actorId))).thenReturn(1);

        assertDoesNotThrow(() -> service.assertSlotAllowed(actorId, slotId));
    }

    @Test
    void tenantScopedCustomerCannotInheritGlobalOperationsRole() {
        TenantContextHolder.set(new TenantContext(UUID.randomUUID(), "arena-one", "Arena One", "CUSTOMER_HOSTED"));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                actorId.toString(), null, Set.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));

        assertThrows(ConflictException.class, () -> service.assertSlotAllowed(actorId, slotId));
        verifyNoInteractions(jdbc);
    }

    @Test
    void tenantScopedAdminRoleIsRecognizedWithoutGlobalAdminRole() {
        TenantContextHolder.set(new TenantContext(UUID.randomUUID(), "arena-one", "Arena One", "CUSTOMER_HOSTED"));
        when(operator.getRoles()).thenReturn(Set.of());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                actorId.toString(), null, Set.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        org.junit.jupiter.api.Assertions.assertTrue(service.isAdministratorActor(actorId));
        verifyNoInteractions(jdbc);
    }

    @Test
    void nonOperatorIsRejectedBeforeAssignmentQuery() {
        when(role.getName()).thenReturn(RoleName.CUSTOMER);

        assertThrows(ConflictException.class, () -> service.assertSlotAllowed(actorId, slotId));
        verify(jdbc, never()).queryForObject(anyString(), eq(Integer.class), any(), any());
    }
}
