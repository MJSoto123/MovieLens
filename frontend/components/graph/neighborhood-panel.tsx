"use client";

import { useEffect, useState } from "react";
import { CytoscapeCanvas } from "@/components/graph/cytoscape-canvas";
import { fetchUserNeighborhood, type ApiMetric, type CytoscapeGraphResponse } from "@/lib/api";

type Props = {
  userId: number;
  metric: ApiMetric;
  onNodeClick?: (userId: number) => void;
};

export function NeighborhoodPanel({ userId, metric, onNodeClick }: Props) {
  const [data, setData] = useState<CytoscapeGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeNeighborEdges, setIncludeNeighborEdges] = useState(false);
  const [inputUserId, setInputUserId] = useState<number>(userId);
  const [activeUserId, setActiveUserId] = useState<number>(userId);

  useEffect(() => {
    setInputUserId(userId);
    setActiveUserId(userId);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchUserNeighborhood(activeUserId, metric, includeNeighborEdges);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar la vecindad.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [activeUserId, metric, includeNeighborEdges]);

  const centerNode = data?.nodes.find((n) => n.data.userId === activeUserId);
  const neighbors = data?.nodes.filter((n) => n.data.userId !== activeUserId) ?? [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-[var(--fg-dim)]">
          <span>Usuario</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={inputUserId}
              onChange={(e) => setInputUserId(Number(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") setActiveUserId(inputUserId); }}
              className="w-28 rounded-xl border border-white/10 bg-[var(--bg-deep)] px-3 py-2 text-[var(--fg)] outline-none transition focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setActiveUserId(inputUserId)}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--bg-deep)] transition hover:opacity-90"
            >
              Cargar
            </button>
          </div>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--fg-dim)]">
          <input
            type="checkbox"
            checked={includeNeighborEdges}
            onChange={(e) => setIncludeNeighborEdges(e.target.checked)}
            className="h-4 w-4 rounded accent-[var(--accent)]"
          />
          Mostrar aristas entre vecinos
        </label>
      </div>

      {/* Graph */}
      {loading && (
        <div className="flex h-80 items-center justify-center rounded-3xl border border-white/8 bg-[var(--surface)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent)]" />
        </div>
      )}
      {error && !loading && (
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
          {error}
        </div>
      )}
      {data && !loading && !error && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <CytoscapeCanvas
            nodes={data.nodes}
            edges={data.edges}
            onNodeClick={(uid) => { setInputUserId(uid); setActiveUserId(uid); onNodeClick?.(uid); }}
            height={420}
            showLabels
          />

          {/* Info panel */}
          <div className="space-y-4">
            {centerNode && (
              <div className="rounded-2xl border border-white/8 bg-[var(--surface)] p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
                  Usuario central
                </p>
                <p className="font-[family:var(--font-serif)] text-2xl">User {centerNode.data.userId}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--fg-dim)]">
                  <Stat label="Comunidad" value={String(centerNode.data.community ?? "—")} />
                  <Stat label="Degree" value={String(centerNode.data.degree)} />
                  <Stat label="PageRank" value={centerNode.data.pagerank.toFixed(5)} />
                  <Stat label="Betweenness" value={centerNode.data.betweenness.toFixed(5)} />
                  <Stat label="Closeness" value={centerNode.data.closeness.toFixed(4)} />
                  <Stat label="Avg sim" value={centerNode.data.avgSimilarity.toFixed(3)} />
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/8 bg-[var(--surface)] p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
                {neighbors.length} vecinos KNN
              </p>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {neighbors
                  .sort((a, b) => b.data.avgSimilarity - a.data.avgSimilarity)
                  .map((n) => {
                    const edge = data.edges.find(
                      (e) =>
                        (e.data.source === `user_${activeUserId}` && e.data.target === `user_${n.data.userId}`) ||
                        (e.data.target === `user_${activeUserId}` && e.data.source === `user_${n.data.userId}`),
                    );
                    return (
                      <button
                        key={n.data.userId}
                        type="button"
                        onClick={() => { setInputUserId(n.data.userId); setActiveUserId(n.data.userId); onNodeClick?.(n.data.userId); }}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-white/5"
                      >
                        <span className="text-[var(--fg)]">User {n.data.userId}</span>
                        <span className="text-[var(--muted)]">
                          {edge ? edge.data.similarityScore.toFixed(3) : "—"}
                          {edge?.data.isMutual ? " ↔" : " →"}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[var(--muted)]">{label}: </span>
      <span className="font-medium text-[var(--fg)]">{value}</span>
    </div>
  );
}
