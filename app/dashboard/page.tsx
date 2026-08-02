"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserPlanetSummary,
  hasPublishedPlanet,
  type UserPlanetSummary,
} from "@/lib/profile/client";

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [planet, setPlanet] = useState<UserPlanetSummary | null>(null);

  useEffect(() => {
    async function load() {
      const summary = await fetchUserPlanetSummary(supabase);
      setPlanet(summary);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <main style={styles.main}>
        <div style={{ ...styles.container, textAlign: "center", paddingTop: 80 }}>
          <p style={{ color: "#aeb6cf" }}>Loading your orbit…</p>
        </div>
      </main>
    );
  }

  const hasPlanet = hasPublishedPlanet(planet);

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>YOUR ORBIT</p>
            <h1 style={styles.title}>Dashboard</h1>
          </div>
          {hasPlanet ? (
            <Link href={`/${planet!.username}`} style={styles.primaryBtn}>
              View my planet
            </Link>
          ) : (
            <Link href="/create" style={styles.primaryBtn}>
              Create your planet
            </Link>
          )}
        </header>

        {hasPlanet && planet ? (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>{planet.display_name}</h2>
            <p style={styles.username}>orbit/{planet.username}</p>
            {planet.bio ? <p style={styles.bio}>{planet.bio}</p> : null}

            <div style={styles.statsRow}>
              <div style={styles.stat}>
                <span style={styles.statValue}>{planet.starCount}</span>
                <span style={styles.statLabel}>Stars</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statValue}>
                  {planet.music_enabled && planet.music_url ? "On" : "Off"}
                </span>
                <span style={styles.statLabel}>Music</span>
              </div>
              <div style={styles.stat}>
                <span
                  style={{
                    ...styles.colorDot,
                    background: planet.planet_color,
                  }}
                />
                <span style={styles.statLabel}>Planet color</span>
              </div>
            </div>

            <div style={styles.actions}>
              <Link href="/create" style={styles.primaryBtn}>
                Customize planet
              </Link>
              <Link href={`/${planet.username}`} style={styles.secondaryBtn}>
                Open public page
              </Link>
            </div>
          </section>
        ) : (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Your universe is waiting</h2>
            <p style={styles.panelText}>
              Create your planet once, then come back here anytime to customize
              it, update your stars, or change your background music.
            </p>
            <Link href="/create" style={styles.primaryBtn}>
              Start building →
            </Link>
          </section>
        )}

        <div style={{ marginTop: 30 }}>
          <Link href="/" style={styles.mutedLink}>
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    padding: "48px 24px",
    background:
      "radial-gradient(circle at top, #17234a 0%, #090b1a 55%, #03040a 100%)",
    color: "white",
  },
  container: { maxWidth: 1000, margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 50,
    flexWrap: "wrap",
  },
  eyebrow: { color: "#a78bfa", letterSpacing: 3, margin: "0 0 8px", fontSize: 12 },
  title: { fontSize: 42, margin: 0 },
  panel: {
    padding: 35,
    borderRadius: 24,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  panelTitle: { marginTop: 0, fontSize: 28 },
  panelText: { color: "#b7bdd1", fontSize: 17, lineHeight: 1.7 },
  username: { color: "#a78bfa", margin: "8px 0 0" },
  bio: { color: "#b7bdd1", lineHeight: 1.6, maxWidth: 480 },
  statsRow: { display: "flex", gap: 24, marginTop: 28, flexWrap: "wrap" },
  stat: { display: "flex", flexDirection: "column", gap: 4 },
  statValue: { fontSize: 22, fontWeight: 700 },
  statLabel: { fontSize: 12, color: "#8f98b5", textTransform: "uppercase" },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    boxShadow: "0 0 16px rgba(124,58,237,0.4)",
  },
  actions: { display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" },
  primaryBtn: {
    display: "inline-block",
    padding: "14px 20px",
    borderRadius: 12,
    background: "#8b5cf6",
    color: "white",
    textDecoration: "none",
    fontWeight: 700,
  },
  secondaryBtn: {
    display: "inline-block",
    padding: "14px 20px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    color: "white",
    textDecoration: "none",
  },
  mutedLink: { color: "#aeb6cf", textDecoration: "none" },
};
