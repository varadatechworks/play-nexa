"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/components/app-provider";
import styles from "../users/users.module.css";

type Member = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  membershipStatus: string;
};

const ROLES = ["ADMIN", "OPERATOR", "COACH", "ORGANIZER", "SHOPKEEPER", "CUSTOMER"];
const STATUSES = ["INVITED", "ACTIVE", "SUSPENDED", "REVOKED"];
const message = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.message ? error.message : fallback;

export default function TenantMembershipsPage() {
  const router = useRouter();
  const { user, ready } = useApp();
  const allowed = !!user?.roles.some(role => role === "ADMIN" || role === "SUPER_ADMIN");
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("OPERATOR");
  const [status, setStatus] = useState("INVITED");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !allowed) router.replace(user ? "/dashboard" : "/login");
  }, [ready, allowed, user, router]);

  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      setLoading(true);
      setError("");
      const result = await api<Member[]>("/api/v1/admin/tenant-memberships");
      setMembers(Array.isArray(result) ? result : []);
    } catch (err) {
      const detail = message(err, "Unable to load arena members.");
      setError(detail.toLowerCase().includes("tenant administrator")
        ? "Tenant Members requires a provisioned tenant context and an ACTIVE OWNER or ADMIN membership. Legacy installations can continue using Users."
        : detail);
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return members;
    return members.filter(member =>
      [member.fullName, member.email, member.role, member.membershipStatus]
        .some(item => String(item || "").toLowerCase().includes(value)));
  }, [members, query]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setBusy(true);
      setError("");
      await api<Member>("/api/v1/admin/tenant-memberships", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), role, status })
      });
      setEmail("");
      setNotice(status === "INVITED"
        ? "Invitation record created. The user must sign in and accept it; this page does not send an email."
        : "Member added to this arena.");
      await load();
    } catch (err) {
      setError(message(err, "Unable to add this member. Check that the account exists and is active."));
    } finally {
      setBusy(false);
    }
  }

  function changeMember(userId: string, field: "role" | "membershipStatus", value: string) {
    setMembers(current => current.map(member => member.userId === userId
      ? { ...member, [field]: value }
      : member));
  }

  async function saveMember(member: Member) {
    try {
      setBusy(true);
      setError("");
      await api<Member>(`/api/v1/admin/tenant-memberships/${member.userId}`, {
        method: "PUT",
        body: JSON.stringify({ role: member.role, status: member.membershipStatus })
      });
      setNotice(`Updated access for ${member.fullName}.`);
      await load();
    } catch (err) {
      setError(message(err, "Unable to update this membership."));
    } finally {
      setBusy(false);
    }
  }

  async function revokeMember(member: Member) {
    if (member.role === "OWNER") return;
    try {
      setBusy(true);
      setError("");
      await api(`/api/v1/admin/tenant-memberships/${member.userId}`, { method: "DELETE" });
      setConfirming(null);
      setNotice(`Access revoked for ${member.fullName}. Membership history was retained.`);
      await load();
    } catch (err) {
      setError(message(err, "Unable to revoke this membership."));
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !allowed) return <main className={styles.page}>Checking administrator access…</main>;

  return (
    <main className={styles.page}>
      <header>
        <div>
          <span>ARENA ACCESS</span>
          <h1>Tenant Members</h1>
          <p>Manage staff and customer access for this arena only. The OWNER account is protected.</p>
        </div>
      </header>

      <section className={styles.dialog} style={{ width: "100%", maxWidth: "none", marginBottom: 18 }}>
        <span>ADD EXISTING ACCOUNT</span>
        <h2>Invite or add a member</h2>
        <form onSubmit={addMember}>
          <div className={styles.grid}>
            <label>Email address
              <input type="email" value={email} onChange={event => setEmail(event.target.value)}
                placeholder="person@example.com" required />
            </label>
            <label>Role
              <select value={role} onChange={event => setRole(event.target.value)}>
                {ROLES.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
              </select>
            </label>
            <label>Initial status
              <select value={status} onChange={event => setStatus(event.target.value)}>
                {STATUSES.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.primary} disabled={busy || !email.trim()}>
              {busy ? "Saving…" : status === "INVITED" ? "Create invitation" : "Add member"}
            </button>
          </div>
        </form>
      </section>

      {notice && <div className={styles.notice} role="status">{notice}</div>}
      {error && <div className={styles.error} role="alert">{error}</div>}

      <section className={styles.toolbar}>
        <input value={query} onChange={event => setQuery(event.target.value)}
          placeholder="Search members, roles or status" aria-label="Search members" />
        <button type="button" onClick={() => void load()} disabled={loading || busy}>Refresh</button>
      </section>

      <section className={styles.tableWrap}>
        <table>
          <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(member => (
              <tr key={member.userId}>
                <td><b>{member.fullName}</b><small>{member.email}</small></td>
                <td>
                  {member.role === "OWNER" ? <span className={styles.role}>OWNER · Protected</span> :
                    <select aria-label={`Role for ${member.fullName}`} value={member.role}
                      onChange={event => changeMember(member.userId, "role", event.target.value)}>
                      {ROLES.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
                    </select>}
                </td>
                <td>
                  {member.role === "OWNER" ? member.membershipStatus :
                    <select aria-label={`Status for ${member.fullName}`} value={member.membershipStatus}
                      onChange={event => changeMember(member.userId, "membershipStatus", event.target.value)}>
                      {STATUSES.map(value => <option key={value} value={value}>{value}</option>)}
                    </select>}
                </td>
                <td>
                  {member.role !== "OWNER" && <div className={styles.actions}>
                    <button type="button" disabled={busy} onClick={() => void saveMember(member)}>Save</button>
                    {confirming === member.userId
                      ? <><button type="button" disabled={busy} onClick={() => void revokeMember(member)}>Confirm revoke</button>
                        <button type="button" onClick={() => setConfirming(null)}>Cancel</button></>
                      : <button type="button" disabled={busy} onClick={() => setConfirming(member.userId)}>Revoke</button>}
                  </div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className={styles.empty}>Loading arena members…</p>}
        {!loading && filtered.length === 0 && <p className={styles.empty}>No members found for this arena.</p>}
      </section>
    </main>
  );
}
