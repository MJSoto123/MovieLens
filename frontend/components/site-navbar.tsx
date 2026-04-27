import type { ReactNode } from "react";
import Link from "next/link";

type SiteNavbarProps = {
  active?: "landing" | "recommendations" | "knn" | "graph";
  userId?: string;
  rightControls?: ReactNode;
};

export function SiteNavbar({
  active = "landing",
  userId = "demo",
  rightControls,
}: SiteNavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[color:var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="logo-ring" />
            <span className="font-[family:var(--font-serif)] text-2xl tracking-[-0.03em]">
              MovieLens Lab
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            <Link
              href={`/graph/${userId}?metric=pearson`}
              className={active === "graph" ? "text-[var(--fg)]" : "hover:text-[var(--fg)]"}
            >
              Grafo
            </Link>
            <Link
              href={`/knn/${userId}?metric=pearson&k=10`}
              className={active === "knn" ? "text-[var(--fg)]" : "hover:text-[var(--fg)]"}
            >
              KNN
            </Link>
            <Link
              href={`/recommendations/${userId}?metric=pearson&k=10`}
              className={active === "recommendations" ? "text-[var(--fg)]" : "hover:text-[var(--fg)]"}
            >
              Recomendaciones
            </Link>
            {/* <Link href="/" className={active === "landing" ? "text-[var(--fg)]" : "hover:text-[var(--fg)]"}>
              Inicio
            </Link> */}
            {/* <span className="opacity-50">Arquitectura</span>
            <span className="opacity-50">Experimentos</span> */}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {rightControls}

          <Link
            href={`/recommendations/${userId}?metric=pearson&k=10`}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 px-2 py-1 pr-4 text-sm text-[var(--fg-dim)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,oklch(0.50_0.10_200),oklch(0.35_0.08_280))] font-[family:var(--font-serif)] text-base text-white">
              {userId.charAt(0).toUpperCase()}
            </span>
            @{userId}
          </Link>
        </div>
      </div>
    </header>
  );
}
