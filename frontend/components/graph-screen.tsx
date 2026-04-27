"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MetricSelector } from "@/components/metric-selector";
import { SiteNavbar } from "@/components/site-navbar";
import { CytoscapeCanvas, type LayoutMode } from "@/components/graph/cytoscape-canvas";
import { NeighborhoodPanel } from "@/components/graph/neighborhood-panel";
import { CentralUsersTable } from "@/components/graph/central-users-table";
import { MetricCompareCards } from "@/components/graph/metric-compare-cards";
import {
  fetchKnnGraph,
  type ApiMetric,
  type CytoscapeGraphResponse,
  type GraphCentrality,
} from "@/lib/api";
import { getMetricById, METRICS } from "@/lib/mock-data";

type Tab = "knn" | "compare" | "neighborhood" | "ranking";

export function GraphScreen({ userId }: { userId: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("knn");
  const [metric, setMetric] = useState<ApiMetric>(
    getMetricById(searchParams.get("metric") ?? "pearson").id,
  );
  const [graphData, setGraphData] = useState<CytoscapeGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedUserId, setFocusedUserId] = useState<number | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("community");

  useEffect(() => {
    const nextMetric = getMetricById(searchParams.get("metric") ?? "pearson").id;
    setMetric(nextMetric);
  }, [searchParams]);

  useEffect(() => {
    if (tab !== "knn") return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKnnGraph(metric, true);
        if (!cancelled) setGraphData(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar el grafo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [metric, tab]);

  function syncUrl(nextMetric: ApiMetric) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("metric", nextMetric);
    router.replace(`/graph/${userId}?${p.toString()}`);
  }

  function handleMetricChange(m: ApiMetric) {
    setMetric(m);
    syncUrl(m);
  }

  function handleNodeClick(clickedUserId: number) {
    setFocusedUserId(clickedUserId);
    setTab("neighborhood");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "knn", label: "Grafo KNN" },
    { id: "compare", label: "Comparar métricas" },
    { id: "neighborhood", label: "Vecindad" },
    { id: "ranking", label: "Ranking" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <SiteNavbar
        active="graph"
        userId={String(userId)}
        rightControls={
          <MetricSelector
            metrics={METRICS}
            selectedMetricId={metric}
            onMetricChange={handleMetricChange}
            compact
          />
        }
      />

      {/* Header */}
      <section className="border-b border-white/8 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="font-[family:var(--font-mono)] text-[11px] tracking-[0.16em] text-[var(--muted)]">
            GRAFO USUARIO-USUARIO · KNN k=10
          </p>
          <h1 className="mt-3 font-[family:var(--font-serif)] text-5xl leading-none tracking-[-0.03em] md:text-6xl">
            Grafo de similitud
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {graphData
              ? `${graphData.nodes.length} usuarios · ${graphData.edges.length} aristas · run #${graphData.run_id}`
              : "Selecciona una métrica y explora las conexiones entre usuarios"}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-white/8 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-1 pt-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm transition rounded-t-lg ${
                  tab === t.id
                    ? "bg-[var(--surface)] text-[var(--fg)] border border-b-0 border-white/8"
                    : "text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {tab === "knn" && (
          <div className="space-y-4">
            {/* Layout selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--muted)]">Layout:</span>
              {(
                [
                  { id: "community", label: "Por comunidad" },
                  { id: "force", label: "Fuerza" },
                  { id: "concentric", label: "Concéntrico" },
                ] as { id: LayoutMode; label: string }[]
              ).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayoutMode(l.id)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    layoutMode === l.id
                      ? "bg-[var(--accent)] text-[var(--bg-deep)] font-semibold"
                      : "border border-white/10 text-[var(--muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex h-[580px] items-center justify-center rounded-3xl border border-white/8 bg-[var(--surface)]">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent)]" />
                  <p className="text-sm text-[var(--muted)]">Cargando grafo {metric} ...</p>
                </div>
              </div>
            )}
            {error && !loading && (
              <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-200">
                <p className="font-medium">No se pudo cargar el grafo</p>
                <p className="mt-1 text-sm opacity-80">{error}</p>
                <p className="mt-3 text-xs text-red-300/60">
                  Ejecuta: <code className="font-mono">docker compose exec backend python scripts/build_user_graph.py {metric}</code>
                </p>
              </div>
            )}
            {graphData && !loading && !error && (
              <CytoscapeCanvas
                nodes={graphData.nodes}
                edges={graphData.edges}
                onNodeClick={handleNodeClick}
                layout={layoutMode}
                height={580}
              />
            )}
          </div>
        )}

        {tab === "compare" && (
          <MetricCompareCards onMetricSelect={handleMetricChange} activeMetric={metric} />
        )}

        {tab === "neighborhood" && (
          <NeighborhoodPanel
            userId={focusedUserId ?? userId}
            metric={metric}
            onNodeClick={handleNodeClick}
          />
        )}

        {tab === "ranking" && (
          <CentralUsersTable
            metric={metric}
            onUserSelect={(uid) => {
              setFocusedUserId(uid);
              setTab("neighborhood");
            }}
          />
        )}
      </div>
    </div>
  );
}
