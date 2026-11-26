"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, api, loadCurrentUserProfile } from "@/lib/api";
import { useApp } from "@/components/app-provider";
import styles from "../admin/users/users.module.css";

export default function TenantInvitationPage() {
  const { user, ready, setUser } = useApp();
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    try {
      setBusy(true);
      setError("");
      await api<void>("/api/v1/tenant-memberships/me/accept", { method: "POST" });
      setAccepted(true);
      const refreshed = await loadCurrentUserProfile().catch(() => null);
      if (refreshed) setUser(refreshed);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("No invitation was found for this account on the current arena. Ask the arena administrator to check the email address.");
      } else if (err instanceof ApiError && err.status === 409) {
        setError("This invitation is no longer active. Ask the arena administrator to review your membership.");
      } else {
        setError(err instanceof Error ? err.message : "Unable to accept this arena invitation.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <main className={styles.page}>Checking your sign-in…</main>;

  return (
    <main className={styles.page}>
      <section className={styles.dialog} style={{ margin: "8vh auto", maxWidth: 620 }}>
        <span>ARENA INVITATION</span>
        <h1>Join this arena</h1>
        {!user ? <>
          <p>Sign in with the email address that received the invitation, then open this page again.</p>
          <div className={styles.modalActions}><Link href="/login">Go to sign in</Link></div>
        </> : accepted ? <>
          <div className={styles.notice} role="status">Your arena membership is active. Your access has been refreshed.</div>
          <div className={styles.modalActions}><Link className={styles.primary} href="/dashboard">Continue to PlayNexa</Link></div>
        </> : <>
          <p>Signed in as <b>{user.email}</b>. Accept the invitation to activate your arena role.</p>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.modalActions}>
            <button className={styles.primary} type="button" disabled={busy} onClick={() => void accept()}>
              {busy ? "Accepting…" : "Accept invitation"}
            </button>
          </div>
        </>}
      </section>
    </main>
  );
}
