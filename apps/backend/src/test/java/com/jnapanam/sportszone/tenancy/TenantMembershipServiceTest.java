package com.jnapanam.sportszone.tenancy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.jnapanam.sportszone.common.exception.ConflictException;
import com.jnapanam.sportszone.identity.model.User;
import com.jnapanam.sportszone.identity.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class TenantMembershipServiceTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final UserRepository users = mock(UserRepository.class);
    private final UUID tenantId = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();
    private final UUID targetId = UUID.randomUUID();
    private final User target = mock(User.class);
    private TenantMembershipService service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.set(new TenantContext(tenantId, "arena-one", "Arena One", "CUSTOMER_HOSTED"));
        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                actorId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        service = new TenantMembershipService(jdbc, users);
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenantId), eq(actorId))).thenReturn(1);
        when(users.findById(targetId)).thenReturn(Optional.of(target));
        when(target.getId()).thenReturn(targetId);
        when(target.getFullName()).thenReturn("Arena Operator");
        when(target.getEmail()).thenReturn("operator@example.test");
        when(target.isActive()).thenReturn(true);
    }

    private void authenticateTarget() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                targetId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void membershipListIsScopedToTheCurrentTenant() {
        TenantMembershipResponse row = new TenantMembershipResponse(targetId, "Arena Operator",
                "operator@example.test", "OPERATOR", "ACTIVE");
        when(jdbc.query(anyString(), any(RowMapper.class), eq(tenantId))).thenReturn(List.of(row));

        assertThat(service.list(actorId)).containsExactly(row);
        verify(jdbc).query(contains("where m.tenant_id=?"), any(RowMapper.class), eq(tenantId));
    }

    @Test
    void tenantAdminCanAddAnExistingAccountByEmail() {
        when(users.findByEmailIgnoreCase("operator@example.test")).thenReturn(Optional.of(target));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        TenantMembershipResponse response = service.addByEmail(actorId,
                new TenantMembershipInviteRequest("operator@example.test",
                        TenantMembershipRole.OPERATOR, TenantMembershipStatus.INVITED));

        assertThat(response.userId()).isEqualTo(targetId);
        assertThat(response.membershipStatus()).isEqualTo("INVITED");
        verify(users).findByEmailIgnoreCase("operator@example.test");
    }

    @Test
    void tenantAdminCannotAddAnEmailWithoutAnExistingAccount() {
        when(users.findByEmailIgnoreCase("missing@example.test")).thenReturn(Optional.empty());

        assertThrows(com.jnapanam.sportszone.common.exception.NotFoundException.class,
                () -> service.addByEmail(actorId, new TenantMembershipInviteRequest("missing@example.test",
                        TenantMembershipRole.CUSTOMER, TenantMembershipStatus.INVITED)));
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void tenantAdminCanAssignAnActiveOperatorMembership() {
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        TenantMembershipResponse response = service.upsert(actorId, targetId,
                new TenantMembershipUpdateRequest(TenantMembershipRole.OPERATOR, TenantMembershipStatus.ACTIVE));

        assertThat(response.userId()).isEqualTo(targetId);
        assertThat(response.role()).isEqualTo("OPERATOR");
        assertThat(response.membershipStatus()).isEqualTo("ACTIVE");
        verify(jdbc).update(contains("on conflict (tenant_id, user_id)"), any(Object[].class));
    }

    @Test
    void globalAdminWithoutActiveTenantAdminMembershipIsDenied() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(tenantId), eq(actorId))).thenReturn(0);

        assertThrows(AccessDeniedException.class, () -> service.upsert(actorId, targetId,
                new TenantMembershipUpdateRequest(TenantMembershipRole.OPERATOR, TenantMembershipStatus.ACTIVE)));

        verifyNoInteractions(users);
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void platformSuperAdminCanManageMembershipWithoutTenantAdminMembership() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                actorId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        TenantMembershipResponse response = service.upsert(actorId, targetId,
                new TenantMembershipUpdateRequest(TenantMembershipRole.COACH, TenantMembershipStatus.INVITED));

        assertThat(response.role()).isEqualTo("COACH");
        verify(jdbc, never()).queryForObject(anyString(), eq(Integer.class), eq(tenantId), eq(actorId));
    }

    @Test
    void inactiveUserCannotBeAddedToTenant() {
        when(target.isActive()).thenReturn(false);

        assertThrows(ConflictException.class, () -> service.upsert(actorId, targetId,
                new TenantMembershipUpdateRequest(TenantMembershipRole.CUSTOMER, TenantMembershipStatus.ACTIVE)));

        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void tenantOwnerMembershipCannotBeOverwrittenOrRevoked() {
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0);
        when(jdbc.queryForObject(anyString(), eq(String.class), eq(tenantId), eq(targetId))).thenReturn("OWNER");

        assertThrows(ConflictException.class, () -> service.upsert(actorId, targetId,
                new TenantMembershipUpdateRequest(TenantMembershipRole.ADMIN, TenantMembershipStatus.ACTIVE)));
        assertThrows(ConflictException.class, () -> service.revoke(actorId, targetId));
    }

    @Test
    void revokeMarksMembershipAsRevokedInsteadOfDeletingIt() {
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        service.revoke(actorId, targetId);

        verify(jdbc).update(contains("set membership_status='REVOKED'"), any(Object[].class));
    }

    @Test
    void invitedUserCanAcceptMembershipInTheCurrentTenant() {
        authenticateTarget();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        service.acceptInvitation(targetId);

        verify(jdbc).update(contains("membership_status='INVITED'"), any(Object[].class));
    }

    @Test
    void acceptingAlreadyActiveMembershipIsIdempotent() {
        authenticateTarget();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0);
        when(jdbc.queryForObject(anyString(), eq(String.class), eq(tenantId), eq(targetId))).thenReturn("ACTIVE");

        service.acceptInvitation(targetId);
    }

    @Test
    void revokedInvitationCannotBeAccepted() {
        authenticateTarget();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0);
        when(jdbc.queryForObject(anyString(), eq(String.class), eq(tenantId), eq(targetId))).thenReturn("REVOKED");

        assertThrows(ConflictException.class, () -> service.acceptInvitation(targetId));
    }

    @Test
    void tenantContextIsRequiredForMembershipAdministration() {
        TenantContextHolder.clear();

        assertThrows(AccessDeniedException.class, () -> service.list(actorId));
        verifyNoInteractions(jdbc);
    }
}
