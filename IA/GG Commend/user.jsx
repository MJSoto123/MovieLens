/* global React, Poster, MovieCard, Nav, Icon, MOVIES, METRICS, matchScore */
const { useState, useMemo, useEffect, useRef } = React;

// ============================================================
// Metric Dropdown — elegante, tipo shadcn Select
// ============================================================
function MetricSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = METRICS.find(m => m.id === value);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="metric-select">
      <button
        className="metric-trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="metric-trigger-icon"><Icon name={current.icon} size={16} /></span>
        <div className="metric-trigger-text">
          <div className="metric-trigger-label mono">MÉTRICA ACTIVA</div>
          <div className="metric-trigger-name">{current.name}</div>
        </div>
        <span style={{ color: "var(--muted)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
          <Icon name="chevron" size={16} />
        </span>
      </button>
      {open && (
        <div className="metric-menu" role="listbox">
          <div className="metric-menu-head mono">SEIS FORMAS DE RECOMENDAR</div>
          {METRICS.map(m => (
            <button
              key={m.id}
              className={"metric-option " + (m.id === value ? "is-active" : "")}
              onClick={() => { onChange(m.id); setOpen(false); }}
              role="option"
              aria-selected={m.id === value}
            >
              <span className="metric-option-icon"><Icon name={m.icon} size={16} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="metric-option-name">{m.name}</div>
                <div className="metric-option-desc">{m.desc}</div>
              </div>
              {m.id === value && (
                <span style={{ color: "var(--accent)" }}><Icon name="check" size={16} /></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Featured (top recommendation hero strip)
// ============================================================
function FeaturedFilm({ movie, score, metricName }) {
  return (
    <div className="featured" key={movie.id}>
      <div className="featured-poster">
        <Poster movie={movie} size="lg" />
      </div>
      <div className="featured-info">
        <div className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.12em", marginBottom: 14 }}>
          TOP MATCH · {metricName.toUpperCase()}
        </div>
        <h2 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.0, letterSpacing: "-0.02em", marginBottom: 16 }}>
          {movie.title}
        </h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22, flexWrap: "wrap" }}>
          <span className="chip"><span className="chip-dot" />{score}% MATCH</span>
          <span className="chip">{movie.genre}</span>
          <span className="chip">{movie.year}</span>
          <span className="chip">{movie.duration}</span>
          <span className="chip">★ {movie.rating}</span>
        </div>
        <p style={{ fontSize: 17, color: "var(--fg-dim)", maxWidth: 560, lineHeight: 1.5, marginBottom: 28 }}>
          {movie.synopsis}
        </p>
        <div className="muted" style={{ fontSize: 13, marginBottom: 28 }}>
          Dir. <span style={{ color: "var(--fg-dim)" }}>{movie.director}</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary btn-lg">Ver detalles<Icon name="arrow-right" size={16} /></button>
          <button className="btn btn-outline btn-lg">+ Watchlist</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Movie Grid — Letterboxd-dense
// ============================================================
function MovieGrid({ movies, metricId, animKey }) {
  return (
    <div className="movie-grid" key={animKey}>
      {movies.map((m, i) => (
        <div
          key={m.id}
          className="grid-item"
          style={{ animationDelay: `${Math.min(i, 18) * 22}ms` }}
        >
          <MovieCard movie={m} score={matchScore(metricId, m.id)} />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Page
// ============================================================
function UserPage() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("u") || "demo";

  const [metricId, setMetricId] = useState("hybrid");
  const metric = METRICS.find(m => m.id === metricId);

  // ordered list per metric
  const ordered = useMemo(() => {
    return metric.order.map(id => MOVIES.find(m => m.id === id)).filter(Boolean);
  }, [metricId]);

  const featured = ordered[0];
  const grid = ordered.slice(1);
  const featuredScore = matchScore(metricId, featured.id);

  // filters (visual only; just narrow the list)
  const [filter, setFilter] = useState("Todas");
  const filters = ["Todas", "Drama", "Sci-Fi", "Thriller", "Romance", "Documental", "Acción", "Comedia", "Animación", "Fantasía"];
  const filtered = filter === "Todas" ? grid : grid.filter(m => m.genre === filter);

  return (
    <div>
      <Nav active="feed" userId={userId} />

      {/* sub-header */}
      <section className="user-head">
        <div className="user-head-inner">
          <div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 12 }}>
              SESIÓN · @{userId.toUpperCase()}
            </div>
            <h1 className="serif" style={{ fontSize: "clamp(36px, 4.4vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Tus recomendaciones de hoy.
            </h1>
            <p style={{ marginTop: 14, color: "var(--muted)", fontSize: 15, maxWidth: 520 }}>
              Curado en vivo según la métrica seleccionada. Cambia el ángulo y la grilla cambia contigo.
            </p>
          </div>
          <MetricSelect value={metricId} onChange={setMetricId} />
        </div>
      </section>

      {/* featured */}
      <section className="featured-section" key={"f-" + metricId}>
        <FeaturedFilm movie={featured} score={featuredScore} metricName={metric.short} />
      </section>

      {/* filters + grid */}
      <section className="grid-section">
        <div className="grid-controls">
          <div className="grid-controls-left">
            <h3 className="serif" style={{ fontSize: 28, letterSpacing: "-0.015em" }}>
              {filtered.length} películas para ti
            </h3>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>
              · {metric.short.toUpperCase()}
            </span>
          </div>
          <div className="filter-pills">
            {filters.map(f => (
              <button
                key={f}
                className={"pill " + (f === filter ? "is-active" : "")}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <MovieGrid movies={filtered} metricId={metricId} animKey={metricId + "-" + filter} />
      </section>

      <footer className="user-footer">
        <div className="mono" style={{ fontSize: 11, color: "var(--muted-2)", letterSpacing: "0.05em" }}>
          CINESCAPE · BUILD 0.4.2 · PRÓXIMA ACTUALIZACIÓN DE MODELO EN 14H 22M
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<UserPage />);
