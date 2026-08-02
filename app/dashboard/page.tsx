"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        background:
          "radial-gradient(circle at top, #17234a 0%, #090b1a 55%, #03040a 100%)",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "50px",
          }}
        >
          <div>
            <p
              style={{
                color: "#a78bfa",
                letterSpacing: "3px",
                margin: "0 0 8px",
              }}
            >
              YOUR ORBIT
            </p>

            <h1
              style={{
                fontSize: "42px",
                margin: 0,
              }}
            >
              Dashboard
            </h1>
          </div>

          <Link
            href="/create"
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              background: "#8b5cf6",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Create your planet
          </Link>
        </header>

        <section
          style={{
            padding: "35px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "28px",
            }}
          >
            Your universe is waiting
          </h2>

          <p
            style={{
              color: "#b7bdd1",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Create your planet, add the things that represent you, and share
            your personal universe with others.
          </p>

          <Link
            href="/create"
            style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "15px 24px",
              borderRadius: "12px",
              background: "#8b5cf6",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Start building →
          </Link>
        </section>

        <div
          style={{
            marginTop: "30px",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#aeb6cf",
              textDecoration: "none",
            }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}