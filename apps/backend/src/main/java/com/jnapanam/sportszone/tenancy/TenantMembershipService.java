package com.jnapanam.sportszone.tenancy;

import com.jnapanam.sportszone.common.exception.ConflictException;
import com.jnapanam.sportszone.common.exception.NotFoundException;
import com.jnapanam.sportszone.identity.model.User;
import com.jnapanam.sportszone.identity.model.RoleName;
import com.jnapanam.sportszone.identity.repository.UserRepository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantMembershipService {
    private final JdbcTemplate jdbc;
    private final UserRepository users;

    public TenantMembershipService(JdbcTemplate jdbc, UserRepository users) {
        this.jdbc = jdbc;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<TenantMembershipResponse> list(UUID actorId) {
        TenantContext tenant = requireTenantAdmin(actorId);
        return jdbc.query("""
                select m.user_id, u.full_name, u.email, m.role, m.membership_status
                from playnexa_tenant_memberships m
                join users u on u.id=m.user_id
                where m.tenant_id=?
                order by case m.role
                    when 'OWNER' then 0 when 'ADMIN' then 1 when 'OPERATOR' then 2
                    when 'COACH' then 3 when 'ORGANIZER' then 4 when 'SHOPKEEPER' then 5
                    else 6 end, lower(u.full_name)
                """, this::map, tenant.tenantId());
    }

    @Transactional
    public TenantMembershipResponse addByEmail(UUID actorId, TenantMembershipInviteRequest request) {
        TenantContext tenant = requireTenantAdmin(actorId);
        User user = users.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new NotFoundException("No existing account was found for that email"));
        return upsertMember(tenant, actorId, user, request.role(), request.status());
    }

    @Transactional
    public TenantMembershipResponse upsert(UUID actorId, UUID userId, TenantMembershipUpdateRequest request) {
        TenantContext tenant = requireTenantAdmin(actorId);
        User user = users.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        return upsertMember(tenant, actorId, user, request.role(), request.status());
    }

    private TenantMembershipResponse upsertMember(TenantContext tenant, UUID actorId, User user,
            TenantMembershipRole role, TenantMembershipStatus status) {
        if (!user.isActive()) throw new ConflictException("An inactive account cannot be added to an arena");
        int changed = jdbc.update("""
                insert into playnexa_tenant_memberships
                    (id, tenant_id, user_id, role, membership_status, invited_by)
                values (gen_random_uuid(), ?, ?, ?, ?, ?)
                on conflict (tenant_id, user_id) do update
                set role=excluded.role,
                    membership_status=excluded.membership_status,
                    invited_by=excluded.invited_by,
                    updated_at=now()
                where playnexa_tenant_memberships.role <> 'OWNER'
                """, tenant.tenantId(), user.getId(), role.name(), status.name(), actorId);
        if (changed == 0) throw new ConflictException("The tenant OWNER membership is protected");
        return new TenantMembershipResponse(user.getId(), user.getFullName(), user.getEmail(),
                role.name(), status.name());
    }

    @Transactional
    public void revoke(UUID actorId, UUID userId) {
        TenantContext tenant = requireTenantAdmin(actorId);
        int changed = jdbc.update("""
                update playnexa_tenant_memberships
                set membership_status='REVOKED', updated_at=now()
                where tenant_id=? and user_id=? and role <> 'OWNER'
                """, tenant.tenantId(), userId);
        if (changed > 0) return;
        String existingRole;
        try {
            existingRole = jdbc.queryForObject("""
                    select role from playnexa_tenant_memberships where tenant_id=? and user_id=?
                    """, String.class, tenant.tenantId(), userId);
        } catch (EmptyResultDataAccessException ex) {
            throw new NotFoundException("Tenant membership not found");
        }
        if ("OWNER".equals(existingRole)) throw new ConflictException("The tenant OWNER membership cannot be revoked");
    }

    @Transactional
    public TenantMembershipSelfResponse current(UUID userId) {
        TenantContext tenant = TenantContextHolder.get();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !userId.toString().equals(authentication.getName())) {
            throw new AccessDeniedException("You can only view your own tenant membership");
        }
        if (tenant == null) return null;
        List<TenantMembershipSelfResponse> memberships = jdbc.query("""
                select tenant_id, role, membership_status
                from playnexa_tenant_memberships where tenant_id=? and user_id=?
                """, (rs, row) -> new TenantMembershipSelfResponse(
                        rs.getObject("tenant_id", UUID.class), rs.getString("role"),
                        rs.getString("membership_status")), tenant.tenantId(), userId);
        if (!memberships.isEmpty()) return memberships.get(0);

        User user = users.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        if (user.isActive() && user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.CUSTOMER)) {
            jdbc.update("""
                    insert into playnexa_tenant_memberships
                        (id, tenant_id, user_id, role, membership_status, invited_by)
                    values (gen_random_uuid(), ?, ?, 'CUSTOMER', 'ACTIVE', NULL)
                    on conflict (tenant_id, user_id) do nothing
                    """, tenant.tenantId(), userId);
            memberships = jdbc.query("""
                    select tenant_id, role, membership_status
                    from playnexa_tenant_memberships where tenant_id=? and user_id=?
                    """, (rs, row) -> new TenantMembershipSelfResponse(
                            rs.getObject("tenant_id", UUID.class), rs.getString("role"),
                            rs.getString("membership_status")), tenant.tenantId(), userId);
            if (!memberships.isEmpty()) return memberships.get(0);
        }
        return new TenantMembershipSelfResponse(tenant.tenantId(), null, "NONE");
    }

    @Transactional
    public void acceptInvitation(UUID userId) {
        TenantContext tenant = TenantContextHolder.get();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (tenant == null || authentication == null || !authentication.isAuthenticated()
                || !userId.toString().equals(authentication.getName())) {
            throw new AccessDeniedException("An authenticated tenant member is required");
        }
        User user = users.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        if (!user.isActive()) throw new ConflictException("An inactive account cannot accept an arena invitation");
        int changed = jdbc.update("""
                update playnexa_tenant_memberships
                set membership_status='ACTIVE', updated_at=now()
                where tenant_id=? and user_id=? and membership_status='INVITED'
                """, tenant.tenantId(), userId);
        if (changed > 0) return;
        String status;
        try {
            status = jdbc.queryForObject("""
                    select membership_status from playnexa_tenant_memberships
                    where tenant_id=? and user_id=?
                    """, String.class, tenant.tenantId(), userId);
        } catch (EmptyResultDataAccessException ex) {
            throw new NotFoundException("Tenant invitation not found");
        }
        if ("ACTIVE".equals(status)) return;
        throw new ConflictException("This tenant invitation is no longer active");
    }

    private TenantContext requireTenantAdmin(UUID actorId) {
        TenantContext tenant = TenantContextHolder.get();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (tenant == null || authentication == null || !authentication.isAuthenticated()
                || !actorId.toString().equals(authentication.getName())) {
            throw new AccessDeniedException("An authenticated tenant administrator is required");
        }
        if (hasPlatformSuperAdmin(authentication)) return tenant;
        Integer count = jdbc.queryForObject("""
                select count(*) from playnexa_tenant_memberships
                where tenant_id=? and user_id=? and membership_status='ACTIVE'
                  and role in ('OWNER','ADMIN')
                """, Integer.class, tenant.tenantId(), actorId);
        if (count == null || count == 0) {
            throw new AccessDeniedException("Only an active tenant OWNER or ADMIN can manage memberships");
        }
        return tenant;
    }

    private static boolean hasPlatformSuperAdmin(Authentication authentication) {
        return authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
    }

    private TenantMembershipResponse map(ResultSet rs, int row) throws SQLException {
        return new TenantMembershipResponse(rs.getObject("user_id", UUID.class), rs.getString("full_name"),
                rs.getString("email"), rs.getString("role"), rs.getString("membership_status"));
    }
}
