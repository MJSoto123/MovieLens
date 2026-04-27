"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MetricSelector } from "@/components/metric-selector";
import { SiteNavbar } from "@/components/site-navbar";
import { fetchRecommendations, fetchUserSummary, type ApiMetric, type RecommendationsResponse, type UserSummaryResponse } from "@/lib/api";
import { getMetricById, METRICS } from "@/lib/mock-data";

export function KNNViewScreen({ userId }: { userId: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [metricId, setMetricId] = useState<ApiMetric>(getMetricById(searchParams.get("metric") ?? "pearson").id);
  const [kValue, setKValue] = useState<number>(Number(searchParams.get("k") ?? "10") || 10);
  const [draftKValue, setDraftKValue] = useState<number>(Number(searchParams.get("k") ?? "10") || 10);
  const [userSummary, setUserSummary] = useState<UserSummaryResponse | null>(null);
  const [recommendationData, setRecommendationData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextMetric = getMetricById(searchParams.get("metric") ?? "pearson").id;
    const nextK = Number(searchParams.get("k") ?? "10") || 10;
    setMetricId(nextMetric);
    setKValue(nextK);
    setDraftKValue(nextK);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [summary, recommendations] = await Promise.all([
          fetchUserSummary(userId),
          fetchRecommendations({ userId, metric: metricId, k: kValue }),
        ]);

        if (cancelled) return;
        setUserSummary(summary);
        setRecommendationData(recommendations);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Ocurrió un error al cargar KNN.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [metricId, userId, kValue]);

  function syncUrl(nextMetricId: ApiMetric, nextKValue: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("metric", nextMetricId);
    params.set("k", String(nextKValue));
    router.replace(`/knn/${userId}?${params.toString()}`);
  }

  function updateMetric(nextMetricId: ApiMetric) {
    setMetricId(nextMetricId);
    syncUrl(nextMetricId, kValue);
  }

  function applyKValue() {
    const sanitized = Math.max(1, Math.min(50, Number.isFinite(draftKValue) ? draftKValue : 10));
    setDraftKValue(sanitized);
    setKValue(sanitized);
    syncUrl(metricId, sanitized);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <SiteNavbar
        active="knn"
        userId={String(userId)}
        rightControls={<MetricSelector metrics={METRICS} selectedMetricId={metricId} onMetricChange={updateMetric} compact />}
      />

      <section className="border-b border-white/8 px-6 py-10 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6">
          <div>
            <p className="font-[family:var(--font-mono)] text-[11px] tracking-[0.16em] text-[var(--muted)]">
              USUARIO @{String(userId).toUpperCase()}
            </p>
            <h1 className="mt-3 font-[family:var(--font-serif)] text-5xl leading-none tracking-[-0.03em] md:text-6xl">
              Tabla KNN
            </h1>
            {userSummary ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                {userSummary.ratings_count} ratings {userSummary.average_rating !== null ? `· ${userSummary.average_rating.toFixed(2)}` : ""}
              </p>
            ) : null}
          </div>

          <div className="flex items-end gap-3">
            <label className="flex flex-col gap-2 text-sm text-[var(--fg-dim)]">
              <span>K vecinos</span>
              <input
                type="number"
                min={1}
                max={50}
                value={draftKValue}
                onChange={(event) => setDraftKValue(Number(event.target.value))}
                className="w-24 rounded-xl border border-white/10 bg-[var(--bg-deep)] px-3 py-2 text-[var(--fg)] outline-none transition focus:border-[var(--accent)]"
              />
            </label>
            <button
              type="button"
              onClick={applyKValue}
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-deep)] transition hover:opacity-90"
            >
              Aplicar
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {loading ? (
          <div className="rounded-3xl border border-white/8 bg-[var(--surface)] p-6">
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl bg-[var(--bg-deep)]" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-200">{error}</div>
        ) : (
          <div className="rounded-3xl border border-white/8 bg-[var(--surface)] p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-[var(--muted)]">
                  <tr className="border-b border-white/8">
                    <th className="px-3 py-3 font-medium">#</th>
                    <th className="px-3 py-3 font-medium">Usuario</th>
                    <th className="px-3 py-3 font-medium">Score</th>
                    <th className="px-3 py-3 font-medium">Co-calificadas</th>
                    <th className="px-3 py-3 font-medium">Métrica</th>
                  </tr>
                </thead>
                <tbody>
                  {(recommendationData?.neighbors ?? []).map((neighbor, index) => (
                    <tr key={neighbor.user_id} className="border-b border-white/6 text-[var(--fg-dim)]">
                      <td className="px-3 py-3">{index + 1}</td>
                      <td className="px-3 py-3 font-medium text-[var(--fg)]">{neighbor.user_id}</td>
                      <td className="px-3 py-3">{neighbor.score.toFixed(4)}</td>
                      <td className="px-3 py-3">{neighbor.common_items}</td>
                      <td className="px-3 py-3 uppercase">{neighbor.metric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
