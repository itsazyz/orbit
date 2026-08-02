"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { computeAllStarLayouts } from "@/lib/universe/star-layout";
import {
  STAR_VISUAL_OPTIONS,
  PLANET_SURFACE_OPTIONS,
  type StarVisualType,
} from "@/lib/universe/visual-styles";
import type { PlanetSurfaceStyle } from "@/types/database";
import { loadPlanetForEditor } from "@/lib/profile/client";
import { MusicPicker } from "@/components/create/MusicPicker";

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "auth", "create", "dashboard",
  "settings", "login", "logout", "signup", "signin",
  "about", "help", "support", "terms", "privacy", "orbit",
  "www", "null", "undefined", "root", "static", "assets",
  "public", "supabase",
]);

type Star = {
  id: string;
  title: string;
  content: string;
  icon: string;
  visualType: StarVisualType;
};

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [planetColor, setPlanetColor] = useState("#7C3AED");
  const [planetSurface, setPlanetSurface] = useState<PlanetSurfaceStyle>("smooth");
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");

  const [stars, setStars] = useState<Star[]>([]);

  const [showStarForm, setShowStarForm] = useState(false);
  const [starTitle, setStarTitle] = useState("");
  const [starContent, setStarContent] = useState("");
  const [starIcon, setStarIcon] = useState("✦");
  const [starVisualType, setStarVisualType] = useState<StarVisualType>("sparkle");

  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/auth/sign-in?redirectTo=/create");
          return;
        }

        const existing = await loadPlanetForEditor(supabase);

        if (existing) {
          setName(existing.profile.display_name);
          setUsername(existing.profile.username);
          setBio(existing.profile.bio);
          setPlanetColor(existing.profile.planet_color);
          setPlanetSurface(existing.profile.planet_surface_style as PlanetSurfaceStyle);
          setMusicEnabled(existing.profile.music_enabled);
          setMusicUrl(existing.profile.music_url);
          setStars(
            existing.stars.map((star) => ({
              id: star.id,
              title: star.title,
              content: star.content,
              icon: star.icon,
              visualType: star.visualType as StarVisualType,
            }))
          );
          setIsEditing(true);
          setStarted(true);
        }
      } catch (err) {
        console.error("[create] init failed:", err);
        setMessage("Could not load your planet. You can still create one below.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  function addStar() {
    if (!starTitle.trim()) {
      setMessage("Please give your star a title.");
      return;
    }

    if (starTitle.trim().length > 60) {
      setMessage("Star title must be 60 characters or less.");
      return;
    }

    if (!starContent.trim()) {
      setMessage("Please write something for this star.");
      return;
    }

    if (starContent.trim().length > 280) {
      setMessage("Star content must be 280 characters or less.");
      return;
    }

    if (stars.length >= 20) {
      setMessage("You can add at most 20 stars.");
      return;
    }

    const newStar: Star = {
      id: crypto.randomUUID(),
      title: starTitle.trim(),
      content: starContent.trim(),
      icon: starIcon,
      visualType: starVisualType,
    };

    setStars((current) => [...current, newStar]);

    setStarTitle("");
    setStarContent("");
    setStarIcon("✦");
    setStarVisualType("sparkle");
    setShowStarForm(false);
    setMessage("");
  }

  function removeStar(id: string) {
    setStars((current) => current.filter((star) => star.id !== id));
  }

  async function publishPlanet() {
    setMessage("");

    const trimmedName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const trimmedBio = bio.trim();

    if (!trimmedName) {
      setMessage("Please enter your name.");
      return;
    }

    if (trimmedName.length > 60) {
      setMessage("Name must be 60 characters or less.");
      return;
    }

    if (!cleanUsername) {
      setMessage("Please choose a username.");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setMessage("Username must be between 3 and 30 characters.");
      return;
    }

    if (!USERNAME_RE.test(cleanUsername)) {
      setMessage(
        "Username can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number."
      );
      return;
    }

    if (RESERVED_USERNAMES.has(cleanUsername)) {
      setMessage("This username is reserved. Please choose another.");
      return;
    }

    if (trimmedBio.length > 240) {
      setMessage("Bio must be 240 characters or less.");
      return;
    }

    if (stars.length === 0) {
      setMessage("Add at least one star before publishing your planet.");
      return;
    }

    setPublishing(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("You need to sign in before creating a planet.");
        setPublishing(false);
        return;
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", cleanUsername)
        .neq("id", user.id)
        .maybeSingle();

      if (existingProfile) {
        setMessage("This username is already taken.");
        setPublishing(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          display_name: trimmedName,
          bio: trimmedBio || null,
          planet_color: planetColor,
          planet_surface_style: planetSurface,
          music_enabled: musicEnabled,
          music_url: musicEnabled && musicUrl.trim() ? musicUrl.trim() : null,
          music_volume: 0.3,
          is_published: true,
          visibility: "public",
        })
        .eq("id", user.id)
        .select("id, username")
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setMessage(
          profileError.message ||
            "Could not save your planet. Please check your username and try again."
        );
        setPublishing(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("stars")
        .delete()
        .eq("profile_id", user.id);

      if (deleteError) {
        console.error("Delete stars error:", deleteError);
        setMessage(
          deleteError.message || "Could not update your stars."
        );
        setPublishing(false);
        return;
      }

      const layouts = computeAllStarLayouts(stars.length);

      const starsToInsert = stars.map((star, index) => {
        const layout = layouts[index]!;
        return {
          profile_id: user.id,
          title: star.title,
          content: star.content,
          icon: star.icon,
          visual_type: star.visualType,
          orbit_speed: 0.8 + (index % 3) * 0.4,
          angle: layout.angle,
          distance: layout.distance,
          size: layout.size,
          sort_order: index,
        };
      });

      const { error: starsError } = await supabase
        .from("stars")
        .insert(starsToInsert);

      if (starsError) {
        console.error("Stars error:", starsError);
        setMessage(
          starsError.message || "Could not save your stars."
        );
        setPublishing(false);
        return;
      }

      window.location.href = `/${profile.username}`;
    } catch (error) {
      console.error("Publish error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while publishing."
      );

      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.main}>
        <div style={{ ...styles.container, textAlign: "center", paddingTop: 80 }}>
          <p style={{ color: "#aeb6cf" }}>Loading your universe…</p>
        </div>
      </main>
    );
  }

  if (started) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <h1 style={styles.pageTitle}>
            {isEditing ? "Customize your planet" : "Build your planet"}
          </h1>

          <p style={styles.pageSubtitle}>
            {isEditing
              ? "Update your world — changes appear on your public page."
              : "Add the details that represent your world."}
          </p>

          <div style={styles.editorGrid}>
            {/* LEFT SIDE */}
            <section style={styles.panel}>
              <label style={styles.label}>Name</label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
                style={styles.input}
              />

              <label style={styles.label}>Username</label>

              <div style={styles.usernameWrapper}>
                <span style={styles.usernamePrefix}>orbit/</span>

                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  placeholder="aziz"
                  style={styles.usernameInput}
                />
              </div>

              <label style={styles.label}>About you</label>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about your world..."
                rows={5}
                maxLength={240}
                style={{
                  ...styles.input,
                  resize: "vertical",
                  minHeight: "120px",
                }}
              />

              <label style={styles.label}>Planet color</label>

              <div style={styles.colorRow}>
                <input
                  type="color"
                  value={planetColor}
                  onChange={(e) => setPlanetColor(e.target.value)}
                  style={styles.colorPicker}
                />

                <span style={styles.colorValue}>{planetColor}</span>
              </div>

              <label style={styles.label}>Planet surface</label>
              <div style={styles.chipRow}>
                {PLANET_SURFACE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setPlanetSurface(option.id as PlanetSurfaceStyle)
                    }
                    style={{
                      ...styles.chip,
                      ...(planetSurface === option.id ? styles.chipActive : {}),
                    }}
                  >
                    {option.labelEn}
                  </button>
                ))}
              </div>

              <label style={styles.label}>Background music</label>
              <MusicPicker
                enabled={musicEnabled}
                onEnabledChange={setMusicEnabled}
                musicUrl={musicUrl}
                onMusicUrlChange={setMusicUrl}
              />

              {/* STARS */}
              <div style={styles.starsHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Your stars</h2>

                  <p style={styles.sectionSubtitle}>
                    Each star represents something about you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowStarForm(true);
                    setMessage("");
                  }}
                  disabled={stars.length >= 20}
                  style={{
                    ...styles.addStarButton,
                    opacity: stars.length >= 20 ? 0.5 : 1,
                    cursor: stars.length >= 20 ? "not-allowed" : "pointer",
                  }}
                >
                  + Add star
                </button>
              </div>

              {/* STAR FORM */}
              {showStarForm && (
                <div style={styles.starForm}>
                  <h3 style={styles.formTitle}>Create a star</h3>

                  <label style={styles.label}>Icon</label>

                  <div style={styles.iconOptions}>
                    {[
                      "✦",
                      "★",
                      "♡",
                      "♪",
                      "☼",
                      "☾",
                      "✈",
                      "◉",
                    ].map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setStarIcon(icon)}
                        style={{
                          ...styles.iconButton,
                          ...(starIcon === icon
                            ? styles.iconButtonActive
                            : {}),
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>

                  <label style={styles.label}>Star shape</label>
                  <div style={styles.chipRow}>
                    {STAR_VISUAL_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setStarVisualType(option.id as StarVisualType)
                        }
                        style={{
                          ...styles.chip,
                          ...(starVisualType === option.id
                            ? styles.chipActive
                            : {}),
                        }}
                      >
                        {option.labelEn}
                      </button>
                    ))}
                  </div>

                  <label style={styles.label}>Star title</label>

                  <input
                    value={starTitle}
                    onChange={(e) => setStarTitle(e.target.value)}
                    placeholder="Music, Dreams, Travel..."
                    maxLength={60}
                    style={styles.input}
                  />

                  <label style={styles.label}>Content</label>

                  <textarea
                    value={starContent}
                    onChange={(e) => setStarContent(e.target.value)}
                    placeholder="Tell people what this means to you..."
                    rows={5}
                    maxLength={280}
                    style={{
                      ...styles.input,
                      resize: "vertical",
                    }}
                  />

                  <div style={styles.formButtons}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStarForm(false);
                        setStarTitle("");
                        setStarContent("");
                        setStarIcon("✦");
                      }}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={addStar}
                      style={styles.saveStarButton}
                    >
                      Add star
                    </button>
                  </div>
                </div>
              )}

              {/* STAR LIST */}
              <div style={styles.starList}>
                {stars.length === 0 ? (
                  <div style={styles.emptyStars}>
                    <div style={styles.emptyStarIcon}>✦</div>

                    <p style={styles.emptyTitle}>
                      Your orbit is empty
                    </p>

                    <p style={styles.emptyText}>
                      Add stars to show people the things that make
                      you, you.
                    </p>
                  </div>
                ) : (
                  stars.map((star) => (
                    <div key={star.id} style={styles.starCard}>
                      <div style={styles.starCardIcon}>
                        {star.icon}
                      </div>

                      <div style={styles.starCardContent}>
                        <h3 style={styles.starCardTitle}>
                          {star.title}
                        </h3>

                        <p style={styles.starCardText}>
                          {star.content}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStar(star.id)}
                        style={styles.deleteButton}
                        aria-label="Delete star"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {message && (
                <div style={styles.message}>
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={publishPlanet}
                disabled={publishing}
                style={{
                  ...styles.publishButton,
                  opacity: publishing ? 0.6 : 1,
                }}
              >
                {publishing
                  ? isEditing
                    ? "Saving..."
                    : "Publishing..."
                  : isEditing
                    ? "Save changes"
                    : "Publish my planet"}
              </button>
            </section>

            {/* PREVIEW */}
            <section style={styles.preview}>
              <div style={styles.previewLabel}>LIVE PREVIEW</div>

              <div style={styles.space}>
                {/* Decorative stars */}
                <span
                  style={{
                    ...styles.previewStar,
                    top: "12%",
                    left: "15%",
                  }}
                >
                  ✦
                </span>

                <span
                  style={{
                    ...styles.previewStarSmall,
                    top: "25%",
                    right: "15%",
                  }}
                >
                  ·
                </span>

                <span
                  style={{
                    ...styles.previewStarSmall,
                    bottom: "20%",
                    left: "18%",
                  }}
                >
                  ·
                </span>

                <span
                  style={{
                    ...styles.previewStar,
                    bottom: "15%",
                    right: "20%",
                  }}
                >
                  ✦
                </span>

                {/* Planet */}
                <div
                  style={{
                    ...styles.planet,
                    background: `radial-gradient(
                      circle at 30% 25%,
                      #ffffff,
                      ${planetColor} 40%,
                      #13072d 100%
                    )`,
                    boxShadow: `0 0 100px ${planetColor}88`,
                  }}
                />

                {/* User stars preview */}
                {stars.map((star, index) => {
                  const positions = [
                    {
                      top: "17%",
                      left: "50%",
                    },
                    {
                      top: "35%",
                      right: "10%",
                    },
                    {
                      bottom: "25%",
                      right: "14%",
                    },
                    {
                      bottom: "12%",
                      left: "50%",
                    },
                    {
                      bottom: "27%",
                      left: "10%",
                    },
                    {
                      top: "35%",
                      left: "8%",
                    },
                  ];

                  const position =
                    positions[index % positions.length];

                  return (
                    <div
                      key={star.id}
                      style={{
                        ...styles.userStar,
                        ...position,
                      }}
                      title={star.title}
                    >
                      <span>{star.icon}</span>

                      <small>{star.title}</small>
                    </div>
                  );
                })}

                <div style={styles.previewName}>
                  <h2>
                    {name || "Your planet"}
                  </h2>

                  <p>
                    {bio ||
                      "Your universe will appear here."}
                  </p>

                  {username && (
                    <span style={styles.previewUsername}>
                      orbit/{username}
                    </span>
                  )}
                </div>
              </div>

              <p style={styles.previewHint}>
                {stars.length === 0
                  ? "Add stars to see them appear around your planet."
                  : `${stars.length} star${
                      stars.length === 1 ? "" : "s"
                    } in your orbit`}
              </p>
            </section>
          </div>

          <div style={styles.backContainer}>
            {isEditing ? (
              <Link href="/dashboard" style={styles.homeLink}>
                ← Back to dashboard
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStarted(false)}
                style={styles.backButton}
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.landing}>
      <div style={styles.landingContent}>
        <div style={styles.heroPlanet} />

        <p style={styles.eyebrow}>
          CREATE YOUR ORBIT
        </p>

        <h1 style={styles.heroTitle}>
          Create your planet
        </h1>

        <p style={styles.heroText}>
          Build a small universe that expresses who you
          are, what you love, and the ideas that orbit
          around you.
        </p>

        <button
          type="button"
          onClick={() => setStarted(true)}
          style={styles.startButton}
        >
          Start creating
        </button>

        <div style={{ marginTop: "28px" }}>
          <Link
            href="/"
            style={styles.homeLink}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  main: {
    minHeight: "100vh",
    padding: "40px 20px 60px",
    background:
      "radial-gradient(circle at center, #17234a 0%, #090b1a 55%, #03040a 100%)",
    color: "white",
    boxSizing: "border-box" as const,
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  pageTitle: {
    textAlign: "center" as const,
    fontSize: "clamp(32px, 5vw, 46px)",
    margin: "0 0 10px",
  },

  pageSubtitle: {
    textAlign: "center" as const,
    color: "#aeb6cf",
    margin: "0 0 40px",
  },

  editorGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(0, 1fr)",
    gap: "30px",
    alignItems: "start",
  },

  panel: {
    padding: "28px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxSizing: "border-box" as const,
  },

  label: {
    display: "block",
    color: "#d9def0",
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "20px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.25)",
    color: "white",
    fontSize: "16px",
    boxSizing: "border-box" as const,
    outline: "none",
  },

  usernameWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginBottom: "20px",
    borderRadius: "10px",
    border:
      "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.25)",
    overflow: "hidden",
    boxSizing: "border-box" as const,
  },

  usernamePrefix: {
    paddingLeft: "14px",
    color: "#8f98b5",
    fontSize: "16px",
  },

  usernameInput: {
    flex: 1,
    minWidth: 0,
    padding: "14px 10px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "white",
    fontSize: "16px",
  },

  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "25px",
  },

  colorPicker: {
    width: "60px",
    height: "45px",
    border: "none",
    borderRadius: "10px",
    background: "transparent",
    cursor: "pointer",
  },

  colorValue: {
    color: "#aeb6cf",
    fontFamily: "monospace",
  },

  starsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginTop: "12px",
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#8992ad",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  addStarButton: {
    flexShrink: 0,
    padding: "10px 14px",
    border: "1px solid rgba(167,139,250,0.4)",
    borderRadius: "10px",
    background: "rgba(124,58,237,0.15)",
    color: "#c4b5fd",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  starForm: {
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.22)",
    border:
      "1px solid rgba(167,139,250,0.22)",
  },

  formTitle: {
    margin: "0 0 18px",
    fontSize: "18px",
  },

  iconOptions: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
    marginBottom: "18px",
  },

  iconButton: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    border:
      "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
  },

  iconButtonActive: {
    border:
      "1px solid rgba(167,139,250,0.8)",
    background: "rgba(124,58,237,0.3)",
    transform: "scale(1.05)",
  },

  formButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  cancelButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.08)",
    color: "#aeb6cf",
    cursor: "pointer",
  },

  saveStarButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#7c3aed",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  starList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },

  emptyStars: {
    padding: "28px 20px",
    borderRadius: "15px",
    border:
      "1px dashed rgba(255,255,255,0.14)",
    textAlign: "center" as const,
  },

  emptyStarIcon: {
    fontSize: "28px",
    color: "#a78bfa",
    marginBottom: "8px",
  },

  emptyTitle: {
    margin: "0 0 5px",
    fontWeight: 700,
  },

  emptyText: {
    margin: 0,
    color: "#8992ad",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  starCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.045)",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  starCardIcon: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "rgba(124,58,237,0.18)",
    color: "#ddd6fe",
    fontSize: "20px",
  },

  starCardContent: {
    flex: 1,
    minWidth: 0,
  },

  starCardTitle: {
    margin: "2px 0 5px",
    fontSize: "15px",
  },

  starCardText: {
    margin: 0,
    color: "#9ca6c0",
    fontSize: "13px",
    lineHeight: 1.5,
    wordBreak: "break-word" as const,
  },

  deleteButton: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    border: "none",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.06)",
    color: "#8f98b5",
    fontSize: "20px",
    cursor: "pointer",
  },

  message: {
    marginTop: "18px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#fca5a5",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  publishButton: {
    width: "100%",
    marginTop: "22px",
    padding: "16px 28px",
    border: "none",
    borderRadius: "14px",
    background: "#7c3aed",
    color: "white",
    fontSize: "17px",
    fontWeight: 700,
    cursor: "pointer",
  },

  preview: {
    minHeight: "650px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.04)",
    border:
      "1px solid rgba(255,255,255,0.1)",
    overflow: "hidden",
  },

  previewLabel: {
    marginBottom: "8px",
    color: "#68718c",
    fontSize: "10px",
    letterSpacing: "3px",
    fontWeight: 700,
  },

  space: {
    position: "relative" as const,
    width: "100%",
    height: "570px",
    overflow: "hidden",
  },

  planet: {
    position: "absolute" as const,
    width: "220px",
    height: "220px",
    left: "50%",
    top: "43%",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
  },

  previewStar: {
    position: "absolute" as const,
    color: "white",
    fontSize: "20px",
    opacity: 0.8,
  },

  previewStarSmall: {
    position: "absolute" as const,
    color: "#c4b5fd",
    fontSize: "30px",
    opacity: 0.6,
  },

  userStar: {
    position: "absolute" as const,
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
    color: "white",
    textShadow:
      "0 0 12px rgba(255,255,255,0.8)",
    fontSize: "18px",
  },

  previewName: {
    position: "absolute" as const,
    left: "50%",
    top: "75%",
    transform: "translateX(-50%)",
    width: "80%",
    textAlign: "center" as const,
  },

  previewNameH2: {
    margin: 0,
  },

  previewUsername: {
    color: "#a78bfa",
    fontSize: "12px",
  },

  previewHint: {
    margin: "0 20px 20px",
    color: "#68718c",
    fontSize: "12px",
    textAlign: "center" as const,
  },

  backContainer: {
    textAlign: "center" as const,
    marginTop: "30px",
  },

  backButton: {
    background: "transparent",
    border: "none",
    color: "#aeb6cf",
    cursor: "pointer",
    fontSize: "15px",
  },

  landing: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at center, #18234a 0%, #090b1a 55%, #03040a 100%)",
    color: "white",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
  },

  landingContent: {
    width: "100%",
    maxWidth: "650px",
  },

  heroPlanet: {
    width: "150px",
    height: "150px",
    margin: "0 auto 32px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 25%, #a78bfa, #5b21b6 55%, #1e103f)",
    boxShadow:
      "0 0 70px rgba(139, 92, 246, 0.55)",
  },

  eyebrow: {
    color: "#a78bfa",
    letterSpacing: "4px",
    fontSize: "12px",
    fontWeight: 700,
  },

  heroTitle: {
    fontSize: "clamp(36px, 6vw, 68px)",
    margin: "15px 0",
  },

  heroText: {
    fontSize: "18px",
    lineHeight: 1.7,
    color: "#b7bdd1",
  },

  startButton: {
    marginTop: "15px",
    padding: "16px 28px",
    border: "none",
    borderRadius: "14px",
    background: "#7c3aed",
    color: "white",
    fontSize: "17px",
    fontWeight: 700,
    cursor: "pointer",
  },

  homeLink: {
    color: "#aeb6cf",
    textDecoration: "none",
  },

  chipRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
    marginBottom: "20px",
  },

  chip: {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#c4c9dc",
    fontSize: "12px",
    cursor: "pointer",
  },

  chipActive: {
    border: "1px solid rgba(167,139,250,0.6)",
    background: "rgba(124,58,237,0.25)",
    color: "white",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    color: "#b7bdd1",
    fontSize: "14px",
    cursor: "pointer",
  },
};