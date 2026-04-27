 "use client";

import Image from "next/image";
import { useState } from "react";

import type { Movie } from "@/lib/mock-data";

function posterGradient(hue: number) {
  return {
    background: `linear-gradient(160deg, oklch(0.32 0.04 ${hue}) 0%, oklch(0.14 0.02 ${hue}) 100%)`,
  };
}

export function PosterCard({
  movie,
  size = "md",
  showImage = true,
  priority = false,
}: {
  movie: Movie;
  size?: "sm" | "md" | "lg";
  showImage?: boolean;
  priority?: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const titleClass =
    size === "lg"
      ? "text-2xl"
      : size === "sm"
        ? "text-base"
        : "text-lg";

  return (
    <div
      className="relative aspect-[2/3] overflow-hidden rounded-[10px] border border-white/6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
      style={posterGradient(movie.hue)}
    >
      {showImage && movie.posterUrl && !imageError ? (
        <>
          {!imageLoaded ? (
            <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02),rgba(255,255,255,0.08))]" />
          ) : null}

          <Image
            src={movie.posterUrl}
            alt={`Poster de ${movie.title}`}
            fill
            sizes={size === "lg" ? "360px" : size === "sm" ? "160px" : "240px"}
            className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        </>
      ) : null}

      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0_1px,transparent_1px_3px)] mix-blend-overlay" />

      <div className="absolute left-3 top-3 font-[family:var(--font-mono)] text-[10px] tracking-[0.18em] text-white/45">
        #{String(movie.id).padStart(3, "0")}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-4 pt-10">
        <h3 className={`font-[family:var(--font-serif)] leading-none text-white ${titleClass}`}>
          {movie.title}
        </h3>
        <p className="mt-2 font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-white/60">
          {movie.year} · {movie.genre}
        </p>
      </div>
    </div>
  );
}

export function RecommendationCard({
  movie,
  score,
  showImage = true,
}: {
  movie: Movie;
  score: number;
  showImage?: boolean;
}) {
  const scoreTone =
    score >= 90
      ? "text-[var(--accent)]"
      : score >= 75
        ? "text-[var(--fg)]"
        : "text-[var(--muted)]";

  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-[10px]">
        <div className="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]">
          <PosterCard movie={movie} showImage={showImage} />
        </div>

        <div
          className={`absolute right-2 top-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-[rgba(20,22,24,0.78)] px-2.5 py-1 font-[family:var(--font-mono)] text-[10px] font-semibold tracking-[0.06em] backdrop-blur ${scoreTone}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              score >= 90 ? "bg-[var(--accent)]" : score >= 75 ? "bg-[var(--fg-dim)]" : "bg-[var(--muted-2)]"
            }`}
          />
          {score}% MATCH
        </div>
      </div>

      <div className="mt-3 px-1">
        <h3 className="font-[family:var(--font-serif)] text-lg leading-tight text-[var(--fg)]">
          {movie.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
          <span>{movie.year}</span>
          <span className="h-1 w-1 rounded-full bg-[var(--muted-2)]" />
          <span>{movie.genre}</span>
        </div>
      </div>
    </article>
  );
}
