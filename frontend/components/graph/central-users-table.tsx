"use client";

import { useEffect, useState } from "react";
import {
  fetchCentralUsers,
  type ApiMetric,
  type CentralUser,
  type GraphCentrality,
} from "@/lib/api";

const CENTRALITIES: { id: GraphCentrality; label: string }[] = [
  { id: "pagerank", label: "PageRank" },
  { id: "degree", label: "Degree" },
  { id: "weighted_degree", label: "W. Degree" },
  { id: "betweenness", label: "Betweenness" },
  { id: "closeness", label: "Closeness" },
];

type Props = {
  metric: ApiMetric;
  onUserSelect: (userId: number) => void;
};

export function CentralUsersTable({ metric, onUserSelect }: Props) {
  const [centrality, setCentrality] = useState<GraphCentrality>("pagerank");
  const [users, setUsers] = useState<CentralUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchCentralUsers(metric, centrality, 30);
        if (!cancelled) setUsers(result.users);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar el ranking.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [metric, centrality]);

  return (
    <div className="space-y-4">
      {/* Centrality selector */}
      <div className="flex flex-wrap gap-2">
        {CENTRALITIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCentrality(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              centrality === c.id
                ? "bg-[var(--accent)] text-[var(--bg-deep)] font-semibold"
                : "border border-white/10 text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/8 bg-[var(--surface)] p-6">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-[var(--bg-deep)]" />
            ))}
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="rounded-3xl border border-white/8 bg-[var(--surface)] p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[var(--muted)]">
                  <th className="px-3 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Usuario</th>
                  <th className="px-3 py-3 font-medium">Comunidad</th>
                  <th className="px-3 py-3 font-medium">Degree</th>
                  <th className="px-3 py-3 font-medium">W.Degree</th>
                  <th className="px-3 py-3 font-medium">Betweenness</th>
                  <th className="px-3 py-3 font-medium">Closeness</th>
                  <th className="px-3 py-3 font-medium">PageRank</th>
                  <th className="px-3 py-3 font-medium">Avg sim</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.user_id}
                    className="cursor-pointer border-b border-white/6 text-[var(--fg-dim)] transition hover:bg-white/4"
                    onClick={() => onUserSelect(u.user_id)}
                  >
                    <td className="px-3 py-3 text-[var(--muted)]">{i + 1}</td>
                    <td className="px-3 py-3 font-medium text-[var(--fg)]">
                      {u.user_id}
                    </td>
                    <td className="px-3 py-3">{u.community_id ?? "—"}</td>
                    <td className="px-3 py-3">{u.degree}</td>
                    <td className="px-3 py-3">{u.weighted_degree.toFixed(2)}</td>
                    <td className="px-3 py-3">{u.betweenness.toFixed(5)}</td>
                    <td className="px-3 py-3">{u.closeness.toFixed(4)}</td>
                    <td className="px-3 py-3 font-medium text-[var(--accent)]">
                      {u.pagerank.toFixed(5)}
                    </td>
                    <td className="px-3 py-3">{u.avg_similarity.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-right text-xs text-[var(--muted)]">
            Haz clic en un usuario para ver su vecindad
          </p>
        </div>
      )}
    </div>
  );
}
