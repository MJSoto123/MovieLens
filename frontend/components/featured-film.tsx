import { PosterCard } from "@/components/poster-card";
import type { Metric, Movie } from "@/lib/mock-data";

export function FeaturedFilm({
  movie,
  score,
  metric,
  showImage = true,
}: {
  movie: Movie;
  score: number;
  metric: Metric;
  showImage?: boolean;
}) {
  return (
    <section className="px-6 py-10 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center xl:gap-14">
        <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[14px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          <PosterCard movie={movie} size="lg" showImage={showImage} priority />
        </div>

        <div className="min-w-0">
          <p className="font-[family:var(--font-mono)] text-[11px] tracking-[0.16em] text-[var(--accent)]">
            TOP MATCH · {metric.short.toUpperCase()}
          </p>
          <h2 className="mt-4 font-[family:var(--font-serif)] text-5xl leading-none tracking-[-0.03em] md:text-6xl">
            {movie.title}
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="chip">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              {score}% MATCH
            </span>
            <span className="chip">{movie.genre}</span>
            <span className="chip">{movie.year}</span>
            <span className="chip">{movie.duration}</span>
            <span className="chip">★ {movie.rating}</span>
          </div>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--fg-dim)]">{movie.synopsis}</p>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Dirección: <span className="text-[var(--fg-dim)]">{movie.director}</span>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:-translate-y-0.5 hover:bg-white"
            >
              Ver detalles
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm text-[var(--fg)] transition hover:bg-[var(--surface)]"
            >
              + Watchlist
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
