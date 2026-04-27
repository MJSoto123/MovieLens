"use client";

import { useEffect, useState } from "react";
import { fetchMetricsSummary, gephi_export_url, type ApiMetric, type MetricSummary } from "@/lib/api";

const METRIC_LABELS: Record<string, string> = {
  pearson: "Pearson",
  cosine: "Coseno",
  euclidean: "Euclidiana",
  manhattan: "Manhattan",
};

type Props = {
  onMetricSelect: (metric: ApiMetric) => void;
  activeMetric: ApiMetric;
};

export function MetricCompareCards({ onMetricSelect, activeMetric }: Props) {
  const [summaries, setSummaries] = useState<MetricSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchMetricsSummary();
        if (!cancelled) setSummaries(result.summaries);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar estadísticas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-3xl bg-[var(--surface)] border border-white/8" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="rounded-3xl border border-white/8 bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
        <p>No hay datos calculados aún.</p>
        <p className="mt-2 text-xs">
          Ejecuta: <code className="font-mono text-[var(--fg)]">docker compose exec backend python scripts/build_user_graph.py</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map((s) => {
          const isActive = s.metric === activeMetric;
          return (
            <button
              key={s.metric}
              type="button"
              onClick={() => onMetricSelect(s.metric as ApiMetric)}
              className={`rounded-3xl border p-5 text-left transition hover:border-[var(--accent)]/60 ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-white/8 bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-[family:var(--font-mono)] text-xs uppercase tracking-widest ${
                    isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"
                  }`}
                >
                  {METRIC_LABELS[s.metric] ?? s.metric}
                </span>
                <span className="text-xs text-[var(--muted)]">run #{s.run_id}</span>
              </div>

              <div className="mt-4 space-y-2">
                <StatRow label="Nodos" value={s.nodes_count} />
                <StatRow label="Aristas" value={s.edges_count} />
                <StatRow label="Aristas mutuas" value={s.mutual_edges_count} />
                <StatRow label="Comunidades" value={s.communities_count} />
                <StatRow label="Densidad" value={s.density.toFixed(5)} />
                <StatRow label="Avg weight" value={s.avg_weight.toFixed(4)} />
                <StatRow label="Avg degree" value={s.avg_degree.toFixed(2)} />
                <StatRow label="Avg PageRank" value={s.avg_pagerank.toFixed(6)} />
                {s.modularity !== null && (
                  <StatRow label="Modularidad" value={s.modularity.toFixed(4)} highlight />
                )}
              </div>

              <a
                href={gephi_export_url(s.metric as ApiMetric)}
                onClick={(e) => e.stopPropagation()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--muted)] transition hover:border-white/30 hover:text-[var(--fg)]"
                download
              >
                ↓ Gephi CSV
              </a>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={highlight ? "font-semibold text-[var(--accent)]" : "text-[var(--fg-dim)]"}>
        {value}
      </span>
    </div>
  );
}
