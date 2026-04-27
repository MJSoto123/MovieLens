/* global React, Poster, Nav, Icon, MOVIES */
const { useMemo } = React;

function PosterMosaic() {
  // 5 columnas, cada una con 6 posters desplazadas verticalmente
  const cols = 5;
  const rows = 6;
  const columns = useMemo(() => {
    const out = [];
    for (let c = 0; c < cols; c++) {
      const arr = [];
      for (let r = 0; r < rows; r++) {
        const idx = (c * rows + r) % MOVIES.length;
        arr.push(MOVIES[idx]);
      }
      out.push(arr);
    }
    return out;
  }, []);

  return (
    <div className="mosaic">
      {columns.map((col, ci) => (
        <div
          key={ci}
          className="mosaic-col"
          style={{
            transform: `translateY(${ci % 2 === 0 ? "-8%" : "4%"})`,
            animation: `mosaic-drift-${ci % 2} ${30 + ci * 4}s linear infinite`,
          }}
        >
          {col.map((m, ri) => (
            <div key={ri} style={{ width: "100%" }}>
              <Poster movie={m} size="md" />
            </div>
          ))}
          {col.map((m, ri) => (
            <div key={"d" + ri} style={{ width: "100%" }}>
              <Poster movie={m} size="md" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-mosaic-wrap" aria-hidden="true">
        <PosterMosaic />
        <div className="hero-mosaic-fade" />
      </div>
      <div className="hero-content">
        <div className="chip" style={{ marginBottom: 28 }}>
          <span className="chip-dot" />
          <span className="mono" style={{ letterSpacing: "0.08em", fontSize: 11 }}>BETA · INVITACIÓN ABIERTA</span>
        </div>
        <h1 className="hero-title serif">
          Encuentra la película<br/>
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>justa</em> para esta noche.
        </h1>
        <p className="hero-sub">
          Cinescape aprende lo que ves, lo que amas y lo que dejaste a la mitad —
          y te recomienda solo lo que vale la pena. Seis algoritmos. Una sola pantalla.
        </p>
        <div className="hero-cta">
          <a href="user.html?u=demo" className="btn btn-primary btn-lg">
            Empezar gratis
            <Icon name="arrow-right" size={16} />
          </a>
          <a href="#how" className="btn btn-outline btn-lg">Cómo funciona</a>
        </div>
        <div className="hero-meta">
          <div><span className="serif" style={{ fontSize: 22 }}>120k</span><span className="muted"> · cinéfilos</span></div>
          <div className="dot" />
          <div><span className="serif" style={{ fontSize: 22 }}>4.8</span><span className="muted"> · rating store</span></div>
          <div className="dot" />
          <div><span className="serif" style={{ fontSize: 22 }}>6</span><span className="muted"> · métricas activas</span></div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      n: "01",
      title: "Seis ángulos de recomendación",
      body: "Cambia entre similitud por usuario, por película, popularidad, rating, género y un modelo híbrido — sin recargar.",
      icon: "sparkles",
    },
    {
      n: "02",
      title: "Sin sugerencias genéricas",
      body: "Cada tarjeta lleva un % de match calculado para ti. Lo que no te conviene, no aparece.",
      icon: "compass",
    },
    {
      n: "03",
      title: "Diseñado para mirar, no para scrollear",
      body: "Grilla densa, tipografía editorial, posters que respiran. Encontrar es una parte del placer.",
      icon: "film",
    },
  ];
  return (
    <section className="section">
      <div className="section-head">
        <div className="section-eyebrow"><span className="mono">01 · POR QUÉ CINESCAPE</span></div>
        <h2 className="serif section-title">Recomendaciones que respetan tu tiempo.</h2>
      </div>
      <div className="benefits-grid">
        {items.map((it) => (
          <div key={it.n} className="benefit">
            <div className="benefit-icon"><Icon name={it.icon} size={20} /></div>
            <div className="mono benefit-num">{it.n}</div>
            <h3 className="serif benefit-title">{it.title}</h3>
            <p className="benefit-body">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { k: "01", t: "Marca lo que ya viste", d: "Califica unas pocas películas que recuerdes. Suficiente para arrancar." },
    { k: "02", t: "Elige tu métrica", d: "Decide cómo quieres que pensemos: por gente parecida a ti, por películas similares, o por género." },
    { k: "03", t: "Mira lo que importa", d: "Recibes una grilla curada. Cambias la métrica y la grilla cambia con animación fluida." },
  ];
  return (
    <section id="how" className="section section-alt">
      <div className="section-head">
        <div className="section-eyebrow"><span className="mono">02 · CÓMO FUNCIONA</span></div>
        <h2 className="serif section-title">Tres pasos hasta tu próxima película.</h2>
      </div>
      <div className="steps">
        {steps.map((s, i) => (
          <div key={s.k} className="step">
            <div className="step-line" />
            <div className="mono step-num">{s.k}</div>
            <div className="serif step-title">{s.t}</div>
            <div className="step-body">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Preview() {
  // 8 posters densos, simula la grilla
  const featured = [4, 1, 12, 20, 8, 23, 15, 6].map(id => MOVIES.find(m => m.id === id));
  return (
    <section className="section">
      <div className="section-head">
        <div className="section-eyebrow"><span className="mono">03 · PREVIEW</span></div>
        <h2 className="serif section-title">La grilla que verás.</h2>
        <p className="section-lead">Densa, editorial, navegable. Cada poster con su match calculado para ti.</p>
      </div>
      <div className="preview-grid">
        {featured.map((m, i) => (
          <div key={m.id} style={{ position: "relative" }}>
            <div style={{
              borderRadius: 6, overflow: "hidden",
              boxShadow: "0 10px 30px -12px rgba(0,0,0,0.6)",
            }}>
              <Poster movie={m} size="md" />
            </div>
            <div style={{
              position: "absolute", top: 8, right: 8,
              padding: "3px 7px",
              background: "rgba(20,22,24,0.78)",
              backdropFilter: "blur(8px)",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "var(--mono)",
              fontSize: 10,
              fontWeight: 600,
              color: i < 3 ? "var(--accent)" : "var(--fg-dim)",
              letterSpacing: "0.04em",
            }}>
              {[97, 94, 91, 88, 85, 83, 80, 77][i]}% MATCH
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 56 }}>
        <a href="user.html?u=demo" className="btn btn-primary btn-lg">
          Ver mi grilla completa
          <Icon name="arrow-right" size={16} />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-row">
        <div className="logo">
          <span className="logo-mark" />
          <span>Cinescape</span>
        </div>
        <div className="footer-links">
          <a href="#">Sobre</a>
          <a href="#">Privacidad</a>
          <a href="#">Términos</a>
          <a href="#">Prensa</a>
          <a href="#">Contacto</a>
        </div>
      </div>
      <div className="footer-meta mono">
        <span>© 2026 Cinescape Studio</span>
        <span>v0.4.2 — concept build</span>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div>
      <Nav active="home" />
      <Hero />
      <Benefits />
      <HowItWorks />
      <Preview />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Landing />);
