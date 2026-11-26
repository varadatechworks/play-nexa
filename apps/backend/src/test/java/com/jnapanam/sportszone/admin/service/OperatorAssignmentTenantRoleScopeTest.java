package com.jnapanam.sportszone.admin.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
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

class OperatorAssignmentTenantRoleScopeTest {
    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID slotId = UUID.randomUUID();
    private final UUID facilityId = UUID.randomUUID();
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final UserRepository users = mock(UserRepository.class);
    private final FacilityRepository facilities = mock(FacilityRepository.class);
    private final OperatorAssignmentService service = new OperatorAssignmentService(jdbc, users, facilities);
    private final User user = mock(User.class);
    private final Role globalRole = mock(Role.class);

    @BeforeEach
    void setUp() {
        TenantContextHolder.set(new TenantContext(tenantId, "arena-one", "Arena One", "CUSTOMER_HOSTED"));
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(user.getRoles()).thenReturn(Set.of(globalRole));
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    void globalAdminRoleDoesNotBypassTenantOperatorFacilityScope() {
        when(globalRole.getName()).thenReturn(RoleName.ADMIN);
        stubTenantRole("OWNER", 0);
        stubTenantRole("ADMIN", 0);
        stubTenantRole("OPERATOR", 1);
        when(jdbc.queryForObject(contains("booking_slots"), eq(Integer.class), eq(slotId), eq(userId)))
                .thenReturn(0);

        assertThrows(NotFoundException.class, () -> service.assertSlotAllowed(userId, slotId));
        verify(jdbc).queryForObject(contains("booking_slots"), eq(Integer.class), eq(slotId), eq(userId));
    }

    @Test
    void activeTenantAdminMembershipBypassesOperatorAssignmentChecks() {
        when(globalRole.getName()).thenReturn(RoleName.CUSTOMER);
        stubTenantRole("OWNER", 0);
        stubTenantRole("ADMIN", 1);

        assertThatCode(() -> service.assertFacilityAllowed(userId, facilityId)).doesNotThrowAnyException();
        verify(jdbc, never()).queryForObject(contains("operator_facility_assignments"), eq(Integer.class),
                any(), any());
    }

    @Test
    void globalOperationsRoleWithoutTenantOperatorMembershipIsDenied() {
        when(globalRole.getName()).thenReturn(RoleName.OPERATIONS);
        stubTenantRole("OWNER", 0);
        stubTenantRole("ADMIN", 0);
        stubTenantRole("OPERATOR", 0);

        assertThrows(ConflictException.class, () -> service.assertSlotAllowed(userId, slotId));
        verify(jdbc, never()).queryForObject(contains("booking_slots"), eq(Integer.class), any(), any());
    }

    @Test
    void platformSuperAdminRetainsPlatformWideBypass() {
        when(globalRole.getName()).thenReturn(RoleName.SUPER_ADMIN);

        assertThatCode(() -> service.assertSlotAllowed(userId, slotId)).doesNotThrowAnyException();
        verifyNoInteractions(jdbc);
    }

    private void stubTenantRole(String role, int count) {
        when(jdbc.queryForObject(contains("role=?"), eq(Integer.class),
                eq(tenantId), eq(userId), eq(role))).thenReturn(count);
    }
}
