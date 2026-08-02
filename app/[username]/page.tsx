"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  planet_color: string | null;
};

type Star = {
  id: string;
  title: string;
  content: string | null;
  icon: string;
  angle: number;
  distance: number;
  size: number;
};

export default function UserPlanetPage() {
  const params = useParams();
  const username = String(params.username);

  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPlanet() {
      setLoading(true);
      setError(false);

      try {
        /*
         * Get the user's planet
         */
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, display_name, bio, planet_color")
          .eq("username", username)
          .eq("is_published", true)
          .eq("visibility", "public")
          .maybeSingle();

        if (profileError) {
          console.error("Profile error:", profileError);
          setError(true);
          setLoading(false);
          return;
        }

        if (!profileData) {
          setError(true);
          setLoading(false);
          return;
        }

        setProfile(profileData);

        /*
         * Get the stars belonging to this planet
         */
        const { data: starsData, error: starsError } = await supabase
          .from("stars")
          .select("id, title, content, icon, angle, distance, size")
          .eq("profile_id", profileData.id)
          .order("sort_order", { ascending: true });

        if (starsError) {
          console.error("Stars error:", starsError);

          // Planet can still be displayed even if stars don't exist yet.
          setStars([]);
        } else {
          setStars(starsData || []);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      }

      setLoading(false);
    }

    loadPlanet();
  }, [supabase, username]);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main className="planet-page">
        <div className="loading">
          <div className="loading-orbit">
            <div className="loading-planet" />
          </div>

          <p>Entering orbit...</p>
        </div>

        <style jsx>{`
          .planet-page {
            min-height: 100svh;
            background:
              radial-gradient(
                circle at center,
                #151d3b 0%,
                #080b18 48%,
                #020308 100%
              );
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .loading {
            text-align: center;
            color: #9da6c2;
          }

          .loading-orbit {
            width: 90px;
            height: 90px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: auto;
            animation: rotate 2s linear infinite;
          }

          .loading-planet {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #7c3aed;
            box-shadow: 0 0 35px rgba(124, 58, 237, 0.8);
          }

          @keyframes rotate {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  /*
   * User doesn't exist
   */
  if (error || !profile) {
    return (
      <main className="not-found">
        <div>
          <div className="lost-planet">✦</div>

          <h1>Planet not found</h1>

          <p>
            This orbit doesn't exist, or the planet hasn't been created yet.
          </p>
        </div>

        <style jsx>{`
          .not-found {
            min-height: 100svh;
            background:
              radial-gradient(
                circle at center,
                #11172e 0%,
                #070914 50%,
                #020308 100%
              );
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
          }

          .not-found h1 {
            font-size: clamp(30px, 7vw, 52px);
            margin: 20px 0 10px;
          }

          .not-found p {
            color: #929bb6;
            max-width: 380px;
            line-height: 1.7;
          }

          .lost-planet {
            font-size: 55px;
            opacity: 0.8;
          }
        `}</style>
      </main>
    );
  }

  const planetColor = profile.planet_color || "#7c3aed";

  return (
    <main className="universe">
      {/* Background stars */}
      <div className="background-stars">
        {Array.from({ length: 70 }).map((_, index) => (
          <span
            key={index}
            className="background-star"
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${(index * 61) % 100}%`,
              animationDelay: `${(index % 8) * 0.5}s`,
              opacity: 0.25 + ((index * 17) % 60) / 100,
            }}
          />
        ))}
      </div>

      {/* Main interactive universe */}
      <div className="universe-stage">

        {/* Orbit rings */}
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="orbit orbit-three" />

        {/* Stars belonging to the user */}
        {stars.map((star) => {
          const radians = (star.angle * Math.PI) / 180;

          const x = Math.cos(radians) * star.distance;
          const y = Math.sin(radians) * star.distance;

          return (
            <button
              key={star.id}
              className="user-star"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                width: `${star.size || 12}px`,
                height: `${star.size || 12}px`,
              }}
              onClick={() => setSelectedStar(star)}
              aria-label={star.title}
            >
              <span className="star-glow" />
              <span className="star-core" />

              <span className="star-label">
                {star.title}
              </span>
            </button>
          );
        })}

        {/* Planet */}
        <button
          className="planet"
          style={{
            background: `
              radial-gradient(
                circle at 30% 25%,
                #ffffff 0%,
                ${planetColor} 22%,
                ${planetColor} 55%,
                #10091f 100%
              )
            `,
            boxShadow: `
              0 0 35px ${planetColor}66,
              0 0 90px ${planetColor}44,
              0 0 180px ${planetColor}22
            `,
          }}
          onClick={() => setSelectedStar(null)}
          aria-label={`${profile.display_name || profile.username}'s planet`}
        >
          <span className="planet-light" />
          <span className="planet-shadow" />
        </button>

        {/* User information */}
        <div className="identity">
          <h1>{profile.display_name || profile.username}</h1>

          <p className="username">@{profile.username}</p>

          {profile.bio && (
            <p className="bio">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Star content panel */}
      {selectedStar && (
        <div
          className="star-overlay"
          onClick={() => setSelectedStar(null)}
        >
          <div
            className="star-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setSelectedStar(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div
              className="modal-star"
              style={{
                boxShadow: `0 0 50px ${planetColor}99`,
              }}
            >
              {selectedStar.icon || "✦"}
            </div>

            <p className="modal-eyebrow">A part of this universe</p>

            <h2>{selectedStar.title}</h2>

            {selectedStar.content ? (
              <p className="modal-content">
                {selectedStar.content}
              </p>
            ) : (
              <p className="modal-content empty">
                No content has been added to this star yet.
              </p>
            )}

            <button
              className="back-button"
              onClick={() => setSelectedStar(null)}
            >
              ← Back to orbit
            </button>
          </div>
        </div>
      )}

      {/* Mobile hint */}
      {stars.length > 0 && !selectedStar && (
        <div className="hint">
          Tap a star to discover something about {profile.display_name || "this person"}
        </div>
      )}

      {stars.length === 0 && (
        <div className="no-stars">
          <span>✦</span>
          <p>This universe is still being created.</p>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .universe {
          position: relative;
          min-height: 100svh;
          width: 100%;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 50%,
              #101936 0%,
              #080b19 42%,
              #020308 100%
            );
          color: white;
          isolation: isolate;
        }

        .background-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .background-star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%,
          100% {
            transform: scale(0.7);
          }

          50% {
            transform: scale(1.8);
          }
        }

        .universe-stage {
          position: relative;
          width: min(100vw, 1100px);
          height: min(100svh, 900px);
          min-height: 600px;
          margin: auto;
        }

        .orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .orbit-one {
          width: 330px;
          height: 330px;
          animation: orbitRotate 25s linear infinite;
        }

        .orbit-two {
          width: 520px;
          height: 520px;
          animation: orbitRotate 38s linear infinite reverse;
        }

        .orbit-three {
          width: 730px;
          height: 730px;
          animation: orbitRotate 55s linear infinite;
        }

        @keyframes orbitRotate {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }

          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        .planet {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 190px;
          height: 190px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: none;
          cursor: pointer;
          overflow: hidden;
          transition:
            transform 0.4s ease,
            box-shadow 0.4s ease;
          z-index: 5;
        }

        .planet:hover {
          transform: translate(-50%, -50%) scale(1.04);
        }

        .planet:active {
          transform: translate(-50%, -50%) scale(0.97);
        }

        .planet-light {
          position: absolute;
          width: 45%;
          height: 45%;
          left: 12%;
          top: 10%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          filter: blur(14px);
        }

        .planet-shadow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            linear-gradient(
              115deg,
              transparent 20%,
              rgba(0, 0, 0, 0.15) 45%,
              rgba(0, 0, 0, 0.65) 100%
            );
        }

        .user-star {
          position: absolute;
          transform: translate(-50%, -50%);
          border: none;
          border-radius: 50%;
          padding: 0;
          background: transparent;
          cursor: pointer;
          z-index: 8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .star-core {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: white;
          box-shadow:
            0 0 8px white,
            0 0 20px rgba(255, 255, 255, 0.8);
          animation: starPulse 2.5s ease-in-out infinite;
        }

        .star-glow {
          position: absolute;
          width: 300%;
          height: 300%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          filter: blur(7px);
        }

        @keyframes starPulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.75;
          }

          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        .star-label {
          position: absolute;
          top: calc(100% + 9px);
          white-space: nowrap;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          opacity: 0;
          transform: translateY(-4px);
          transition: all 0.25s ease;
          pointer-events: none;
        }

        .user-star:hover .star-label,
        .user-star:focus .star-label {
          opacity: 1;
          transform: translateY(0);
        }

        .identity {
          position: absolute;
          top: calc(50% + 125px);
          left: 50%;
          transform: translateX(-50%);
          width: min(90%, 420px);
          text-align: center;
          z-index: 10;
          pointer-events: none;
        }

        .identity h1 {
          margin: 0;
          font-size: clamp(25px, 5vw, 38px);
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .username {
          margin: 7px 0 0;
          color: #a78bfa;
          font-size: 14px;
        }

        .bio {
          margin: 13px auto 0;
          color: #9da6c2;
          line-height: 1.6;
          font-size: 14px;
          max-width: 350px;
        }

        .hint {
          position: fixed;
          left: 50%;
          bottom: 25px;
          transform: translateX(-50%);
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px);
          color: #aeb6cf;
          font-size: 12px;
          z-index: 20;
          white-space: nowrap;
        }

        .no-stars {
          position: fixed;
          left: 50%;
          bottom: 30px;
          transform: translateX(-50%);
          text-align: center;
          color: #7d86a2;
          font-size: 12px;
        }

        .no-stars span {
          display: block;
          font-size: 22px;
          margin-bottom: 5px;
        }

        .no-stars p {
          margin: 0;
        }

        .star-overlay {
          position: fixed;
          inset: 0;
          background: rgba(1, 2, 8, 0.72);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 100;
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .star-modal {
          position: relative;
          width: min(100%, 470px);
          max-height: 85svh;
          overflow-y: auto;
          padding: 42px 28px 28px;
          border-radius: 28px;
          text-align: center;
          background:
            radial-gradient(
              circle at top,
              rgba(124, 58, 237, 0.16),
              rgba(10, 12, 28, 0.97) 50%
            );
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 30px 100px rgba(0, 0, 0, 0.5),
            inset 0 1px rgba(255, 255, 255, 0.06);
          animation: modalIn 0.3s ease;
        }

        @keyframes modalIn {
          from {
            transform: scale(0.94) translateY(15px);
            opacity: 0;
          }

          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        .close-button {
          position: absolute;
          right: 16px;
          top: 14px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 24px;
          cursor: pointer;
        }

        .modal-star {
          width: 58px;
          height: 58px;
          margin: 0 auto 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          background: radial-gradient(circle, white 0%, #a78bfa 30%, #7c3aed 70%, transparent 72%);
        }

        .modal-eyebrow {
          margin: 0 0 9px;
          color: #a78bfa;
          font-size: 12px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .star-modal h2 {
          margin: 0;
          font-size: clamp(27px, 7vw, 38px);
        }

        .modal-content {
          margin: 20px auto 0;
          color: #b8bfd3;
          line-height: 1.8;
          font-size: 15px;
          white-space: pre-wrap;
        }

        .modal-content.empty {
          color: #6f7892;
        }

        .back-button {
          margin-top: 28px;
          padding: 13px 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          color: white;
          cursor: pointer;
          font-size: 14px;
        }

        @media (max-width: 600px) {
          .universe-stage {
            min-height: 100svh;
            height: 100svh;
          }

          .orbit-one {
            width: 230px;
            height: 230px;
          }

          .orbit-two {
            width: 360px;
            height: 360px;
          }

          .orbit-three {
            width: 500px;
            height: 500px;
          }

          .planet {
            width: 135px;
            height: 135px;
          }

          .identity {
            top: calc(50% + 100px);
          }

          .star-label {
            display: none;
          }

          .hint {
            bottom: 18px;
            max-width: calc(100% - 30px);
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        @media (max-height: 700px) and (max-width: 600px) {
          .planet {
            width: 115px;
            height: 115px;
          }

          .identity {
            top: calc(50% + 85px);
          }

          .identity h1 {
            font-size: 24px;
          }

          .bio {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}