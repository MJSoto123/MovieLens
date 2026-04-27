/* global React */
const { useState } = React;

// ============================================================
// Poster — tonal gradient + monospace placeholder. NO hand-drawn SVG.
// ============================================================
function Poster({ movie, size = "md" }) {
  const sizes = {
    sm: { w: 120, h: 180, t: 12 },
    md: { w: 180, h: 270, t: 14 },
    lg: { w: 260, h: 390, t: 16 },
    xl: { w: 360, h: 540, t: 20 },
  };
  const s = sizes[size];
  const { hue } = movie;

  // tonal gradient per movie
  const top = `oklch(0.32 0.04 ${hue})`;
  const bottom = `oklch(0.14 0.02 ${hue})`;

  return (
    <div
      className="poster"
      style={{
        width: "100%",
        aspectRatio: "2/3",
        position: "relative",
        background: `linear-gradient(160deg, ${top} 0%, ${bottom} 100%)`,
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {/* faint grain */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)",
        mixBlendMode: "overlay",
      }} />
      {/* title bar at bottom */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "10px 12px",
        background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)",
      }}>
        <div className="serif" style={{ fontSize: s.t + 2, lineHeight: 1.1, color: "var(--fg)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          {movie.title}
        </div>
        <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 4, letterSpacing: "0.04em" }}>
          {String(movie.year)} · {movie.genre.toUpperCase()}
        </div>
      </div>
      {/* corner mark */}
      <div className="mono" style={{
        position: "absolute", top: 8, left: 10, fontSize: 9, letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.4)",
      }}>
        #{String(movie.id).padStart(3, "0")}
      </div>
    </div>
  );
}

// ============================================================
// Card — used in grid
// ============================================================
function MovieCard({ movie, score, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.25s ease, opacity 0.25s ease",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      <div style={{
        position: "relative",
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: hover
          ? "0 18px 40px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)"
          : "0 6px 16px -8px rgba(0,0,0,0.5)",
        transition: "box-shadow 0.25s ease",
      }}>
        <Poster movie={movie} size="md" />
        {/* match score badge */}
        {score != null && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 7px",
            background: "rgba(20,22,24,0.78)",
            backdropFilter: "blur(8px)",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "var(--mono)",
            fontSize: 10,
            fontWeight: 600,
            color: score >= 90 ? "var(--accent)" : score >= 75 ? "var(--fg)" : "var(--muted)",
            letterSpacing: "0.04em",
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: score >= 90 ? "var(--accent)" : score >= 75 ? "var(--fg-dim)" : "var(--muted-2)",
            }} />
            {score}% MATCH
          </div>
        )}
      </div>
      {/* meta below */}
      <div style={{ marginTop: 10, paddingLeft: 2 }}>
        <div className="serif" style={{ fontSize: 16, lineHeight: 1.2, color: "var(--fg)" }}>
          {movie.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
          <span>{movie.year}</span>
          <span style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--muted-2)" }} />
          <span>{movie.genre}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Nav (shared)
// ============================================================
function Nav({ active, userId }) {
  return (
    <header className="nav">
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <a href="landing.html" className="logo">
          <span className="logo-mark" />
          <span>Cinescape</span>
        </a>
        <nav className="nav-links">
          <a href={userId ? `user.html?u=${userId}` : "user.html?u=demo"} style={{ color: active === "feed" ? "var(--fg)" : undefined }}>Para ti</a>
          <a href="#" style={{ opacity: 0.5 }}>Explorar</a>
          <a href="#" style={{ opacity: 0.5 }}>Listas</a>
          <a href="#" style={{ opacity: 0.5 }}>Diario</a>
        </nav>
      </div>
      <div className="nav-actions">
        <button className="btn btn-ghost" aria-label="Buscar" style={{ padding: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </button>
        {userId ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "4px 14px 4px 4px",
            border: "1px solid var(--border)",
            borderRadius: 999,
            fontSize: 13,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, oklch(0.50 0.10 200), oklch(0.35 0.08 280))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--serif)", fontSize: 14,
            }}>
              {userId[0]?.toUpperCase() || "C"}
            </div>
            <span style={{ color: "var(--fg-dim)" }}>{userId}</span>
          </div>
        ) : (
          <>
            <a href="#" className="btn btn-ghost">Iniciar sesión</a>
            <a href="user.html?u=demo" className="btn btn-primary">Empezar</a>
          </>
        )}
      </div>
    </header>
  );
}

// Icon set (small, inline strokes — no hand-drawn art)
function Icon({ name, size = 16 }) {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.6,
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "users":     return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "film":      return <svg {...props}><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 8h20M2 16h20M2 12h20"/></svg>;
    case "flame":     return <svg {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.5 0 3-1.2 3-3 0-1-.5-2-1.5-3-2-2-2.5-3-2.5-5 0 1.5-1 3-2.5 4.5C6 12 5 13.5 5 15a5 5 0 0 0 10 0c0-1.5-.5-2.5-1.5-3.5"/></svg>;
    case "star":      return <svg {...props}><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/></svg>;
    case "compass":   return <svg {...props}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
    case "sparkles":  return <svg {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case "chevron":   return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>;
    case "arrow-right": return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case "check":     return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
    case "info":      return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>;
    default: return null;
  }
}

Object.assign(window, { Poster, MovieCard, Nav, Icon });
