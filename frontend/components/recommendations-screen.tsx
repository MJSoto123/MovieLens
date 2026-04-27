"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FeaturedFilm } from "@/components/featured-film";
import { MetricSelector } from "@/components/metric-selector";
import { MovieGrid } from "@/components/movie-grid";
import { SiteNavbar } from "@/components/site-navbar";
import { fetchRecommendations, fetchUserSummary, type ApiMetric, type RecommendationsResponse, type UserSummaryResponse } from "@/lib/api";
import { genreLabel, getMetricById, METRICS, parseMovieTitleAndYear, type Movie } from "@/lib/mock-data";

function buildMovieFromRecommendation(
  recommendation: RecommendationsResponse["recommendations"][number],
): Movie {
  const parsed = parseMovieTitleAndYear(recommendation.title);

  return {
    id: recommendation.movie_id,
    title: parsed.title,
    year: parsed.year,
    genre: genreLabel(recommendation.genres),
    duration: "N/D",
    rating: Number(recommendation.predicted_rating.toFixed(1)),
    hue: (recommendation.movie_id * 37) % 360,
    director: "MovieLens",
    synopsis: `Predicción calculada con ${recommendation.supporting_neighbors} vecino(s) de apoyo usando la métrica seleccionada.`,
    posterUrl: recommendation.poster_url,
  };
}

export function RecommendationsScreen({ userId }: { userId: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMetric = getMetricById(searchParams.get("metric") ?? "pearson").id;

  const [metricId, setMetricId] = useState<ApiMetric>(initialMetric);
  const [selectedGenre, setSelectedGenre] = useState("Todas");
  const [recommendationData, setRecommendationData] = useState<RecommendationsResponse | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagesEnabled, setImagesEnabled] = useState(true);

  useEffect(() => {
    setMetricId(getMetricById(searchParams.get("metric") ?? "pearson").id);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [summary, recommendations] = await Promise.all([
          fetchUserSummary(userId),
          fetchRecommendations({
            userId,
            metric: metricId,
          }),
        ]);

        if (cancelled) {
          return;
        }

        setUserSummary(summary);
        setRecommendationData(recommendations);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Ocurrió un error al cargar recomendaciones.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [metricId, userId]);

  const metric = getMetricById(metricId);

  const movies = useMemo(() => {
    return (recommendationData?.recommendations ?? []).map(buildMovieFromRecommendation);
  }, [recommendationData]);

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    for (const movie of movies) {
      genres.add(movie.genre);
    }
    return ["Todas", ...Array.from(genres)];
  }, [movies]);

  const featuredMovie = movies[0];
  const gridMovies = movies.slice(1);

  const visibleMovies = useMemo(() => {
    if (selectedGenre === "Todas") {
      return gridMovies;
    }
    return gridMovies.filter((movie) => movie.genre === selectedGenre);
  }, [gridMovies, selectedGenre]);

  useEffect(() => {
    if (!availableGenres.includes(selectedGenre)) {
      setSelectedGenre("Todas");
    }
  }, [availableGenres, selectedGenre]);

  function updateMetric(nextMetricId: ApiMetric) {
    setMetricId(nextMetricId);
    setSelectedGenre("Todas");

    const params = new URLSearchParams(searchParams.toString());
    params.set("metric", nextMetricId);
    router.replace(`/recommendations/${userId}?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <SiteNavbar active="recommendations" userId={String(userId)} />

      <section className="border-b border-white/8 px-6 py-12 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-[family:var(--font-mono)] text-[11px] tracking-[0.16em] text-[var(--muted)]">
              SESIÓN · @{String(userId).toUpperCase()}
            </p>
            <h1 className="mt-4 font-[family:var(--font-serif)] text-5xl leading-none tracking-[-0.03em] md:text-6xl">
              Tus recomendaciones de hoy.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--fg-dim)]">
              Ahora esta pantalla sí consume la API real. Cambiás la métrica y el backend recalcula para el
              mismo usuario.
            </p>
            <p className="mt-4 max-w-2xl text-sm text-[var(--muted)]">{metric.eyebrow}</p>
            {userSummary ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Usuario con {userSummary.ratings_count} ratings
                {userSummary.average_rating !== null
                  ? ` · promedio ${userSummary.average_rating.toFixed(2)}`
                  : ""}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setImagesEnabled((value) => !value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  imagesEnabled
                    ? "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--surface)]"
                    : "border-white/10 text-[var(--muted)] hover:border-white/20 hover:text-[var(--fg)]"
                }`}
              >
                {imagesEnabled ? "Imágenes activadas" : "Imágenes desactivadas"}
              </button>
              <span className="self-center text-xs text-[var(--muted)]">
                Usalo para probar si la demora viene de TMDB o del cálculo.
              </span>
            </div>
          </div>

          <MetricSelector metrics={METRICS} selectedMetricId={metricId} onMetricChange={updateMetric} />
        </div>
      </section>

      {loading ? (
        <>
          <section className="px-6 py-10 lg:px-10">
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center xl:gap-14">
              <div className="aspect-[2/3] w-full max-w-[360px] animate-pulse rounded-[14px] border border-white/8 bg-[var(--surface)]" />

              <div className="space-y-4">
                <div className="h-4 w-44 animate-pulse rounded-full bg-[var(--surface)]" />
                <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-[var(--surface)]" />
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-8 w-24 animate-pulse rounded-full bg-[var(--surface)]"
                    />
                  ))}
                </div>
                <div className="h-5 w-full animate-pulse rounded-full bg-[var(--surface)]" />
                <div className="h-5 w-5/6 animate-pulse rounded-full bg-[var(--surface)]" />
                <div className="h-5 w-2/3 animate-pulse rounded-full bg-[var(--surface)]" />
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-10">
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="h-10 w-64 animate-pulse rounded-2xl bg-[var(--surface)]" />
                <div className="h-4 w-56 animate-pulse rounded-full bg-[var(--surface)]" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 w-24 animate-pulse rounded-full bg-[var(--surface)]"
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="aspect-[2/3] animate-pulse rounded-[10px] border border-white/8 bg-[var(--surface)]" />
                  <div className="h-5 w-5/6 animate-pulse rounded-full bg-[var(--surface)]" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-[var(--surface)]" />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : error ? (
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-200">
            {error}
          </div>
        </section>
      ) : !featuredMovie ? (
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="rounded-3xl border border-white/8 bg-[var(--surface)] p-8 text-[var(--fg-dim)]">
            No hay recomendaciones disponibles para este usuario con los parámetros actuales.
          </div>
        </section>
      ) : (
        <>
          <FeaturedFilm
            movie={featuredMovie}
            score={Math.round((recommendationData?.recommendations[0]?.predicted_rating ?? 0) * 20)}
            metric={metric}
            showImage={imagesEnabled}
          />

          <section className="mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-10">
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-[family:var(--font-serif)] text-3xl tracking-[-0.02em]">
                    {visibleMovies.length} películas para vos
                  </h2>
                  <span className="font-[family:var(--font-mono)] text-[11px] tracking-[0.16em] text-[var(--muted)]">
                    · {metric.short.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {recommendationData?.neighbors.length ?? 0} vecinos cercanos considerados para esta respuesta.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedGenre === genre
                        ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg-deep)]"
                        : "border-white/10 text-[var(--muted)] hover:border-white/20 hover:text-[var(--fg)]"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <MovieGrid
              movies={visibleMovies}
              showImage={imagesEnabled}
              getScore={(movieId) => {
                const recommendation = recommendationData?.recommendations.find((item) => item.movie_id === movieId);
                return Math.round((recommendation?.predicted_rating ?? 0) * 20);
              }}
            />
          </section>
        </>
      )}
    </div>
  );
}
