import Link from "next/link";

import { Icon } from "@/components/icons";
import { PosterCard } from "@/components/poster-card";
import { SiteNavbar } from "@/components/site-navbar";
import { getMoviesForMetric, MOVIES } from "@/lib/mock-data";

function PosterMosaic() {
  const columns = Array.from({ length: 5 }, (_, columnIndex) =>
    Array.from({ length: 6 }, (_, rowIndex) => MOVIES[(columnIndex * 4 + rowIndex) % MOVIES.length]),
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="landing-mosaic absolute inset-[-8%] hidden grid-cols-3 gap-3 opacity-70 md:grid lg:grid-cols-5">
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="flex flex-col gap-3"
            style={{
              transform: `translateY(${columnIndex % 2 === 0 ? "-8%" : "4%"})`,
              animation: `${columnIndex % 2 === 0 ? "mosaic-drift-up" : "mosaic-drift-down"} ${
                28 + columnIndex * 4
              }s linear infinite`,
            }}
          >
            {[...column, ...column].map((movie, posterIndex) => (
              <PosterCard key={`${columnIndex}-${posterIndex}`} movie={movie} size="sm" />
            ))}
          </div>
        ))}
      </div>
      <div className="landing-veil absolute inset-0" />
    </div>
  );
}

const previewMovies = getMoviesForMetric("pearson").slice(0, 8);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <SiteNavbar active="landing" userId="1" />

      <section className="relative flex min-h-[90vh] items-center overflow-hidden px-6 py-20 lg:px-10">
        <PosterMosaic />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl">
          <div className="max-w-3xl">
            <div className="chip mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span className="font-[family:var(--font-mono)] text-[11px] tracking-[0.12em]">
                MOVIELENS SMALL · 100,836 RATINGS
              </span>
            </div>

            <h1 className="max-w-4xl font-[family:var(--font-serif)] text-6xl leading-none tracking-[-0.04em] md:text-7xl xl:text-8xl">
              Encontrá la película
              <br />
              <span className="text-[var(--accent)]">justa</span> para esta noche.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--fg-dim)]">
              Una demo visual para nuestro proyecto de recomendación con MovieLens. El usuario elige la
              métrica y la grilla cambia según Pearson, Coseno, Euclidiana o Manhattan.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/recommendations/1?metric=pearson"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Ver recomendaciones
                <Icon name="arrow-right" />
              </Link>
              <Link
                href="/recommendations/1?metric=cosine"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm text-[var(--fg)] transition hover:bg-[var(--surface)]"
              >
                Cambiar métrica
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-sm text-[var(--fg-dim)]">
              <div>
                <span className="font-[family:var(--font-serif)] text-2xl text-[var(--fg)]">610</span> usuarios
              </div>
              <span className="h-1 w-1 rounded-full bg-[var(--muted-2)]" />
              <div>
                <span className="font-[family:var(--font-serif)] text-2xl text-[var(--fg)]">9,742</span>{" "}
                películas
              </div>
              <span className="h-1 w-1 rounded-full bg-[var(--muted-2)]" />
              <div>
                <span className="font-[family:var(--font-serif)] text-2xl text-[var(--fg)]">4</span> métricas
                activas
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="max-w-3xl">
          <p className="font-[family:var(--font-mono)] text-[11px] tracking-[0.16em] text-[var(--muted)]">
            PREVIEW · GRID DE RECOMENDACIONES
          </p>
          <h2 className="mt-5 font-[family:var(--font-serif)] text-5xl leading-none tracking-[-0.03em]">
            La grilla cambia con la métrica.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--fg-dim)]">
            Nos quedamos con lo que sí sirve del diseño: landing potente, selector elegante y una grilla
            editorial. Todo lo demás sobra para esta primera versión.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {previewMovies.map((movie, index) => (
            <div key={movie.id} className="relative">
              <PosterCard movie={movie} />
              <div className="absolute right-2 top-2 rounded-full border border-white/8 bg-black/55 px-2.5 py-1 font-[family:var(--font-mono)] text-[10px] tracking-[0.06em] text-[var(--accent)] backdrop-blur">
                {[98, 95, 93, 91, 89, 86, 83, 80][index]}% MATCH
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
