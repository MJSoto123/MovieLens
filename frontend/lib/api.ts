export type ApiMetric = "pearson" | "cosine" | "euclidean" | "manhattan";

export type ApiNeighbor = {
  user_id: number;
  score: number;
  common_items: number;
  metric: ApiMetric;
};

export type ApiRecommendation = {
  movie_id: number;
  title: string;
  genres: string;
  imdb_id?: number | null;
  tmdb_id?: number | null;
  poster_url?: string | null;
  predicted_rating: number;
  supporting_neighbors: number;
};

export type RecommendationsResponse = {
  user_id: number;
  metric: ApiMetric;
  neighbors: ApiNeighbor[];
  recommendations: ApiRecommendation[];
};

export type UserSummaryResponse = {
  user_id: number;
  ratings_count: number;
  average_rating: number | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ── Graph types ───────────────────────────────────────────────────────────────

export type GraphNodeData = {
  id: string;
  label: string;
  userId: number;
  community: number | null;
  degree: number;
  weightedDegree: number;
  betweenness: number;
  closeness: number;
  pagerank: number;
  avgSimilarity: number;
};

export type GraphNode = { data: GraphNodeData };

export type GraphEdgeData = {
  id: string;
  source: string;
  target: string;
  metric: string;
  weight: number;
  similarityScore: number;
  rank: number;
  isMutual: boolean;
};

export type GraphEdge = { data: GraphEdgeData };

export type CytoscapeGraphResponse = {
  metric: string;
  k: number;
  run_id: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type MetricSummary = {
  metric: string;
  run_id: number;
  nodes_count: number;
  edges_count: number;
  mutual_edges_count: number;
  density: number;
  avg_weight: number;
  communities_count: number;
  avg_degree: number;
  avg_weighted_degree: number;
  avg_pagerank: number;
  avg_betweenness: number;
  avg_closeness: number;
  modularity: number | null;
};

export type MetricsSummaryResponse = { summaries: MetricSummary[] };

export type CentralUser = {
  user_id: number;
  community_id: number | null;
  degree: number;
  weighted_degree: number;
  betweenness: number;
  closeness: number;
  pagerank: number;
  avg_similarity: number;
};

export type CentralUsersResponse = {
  metric: string;
  centrality: string;
  run_id: number;
  users: CentralUser[];
};

export type GraphCentrality = "degree" | "weighted_degree" | "betweenness" | "closeness" | "pagerank";

export async function fetchRecommendations(params: {
  userId: number;
  metric: ApiMetric;
  k?: number;
  minCommonItems?: number;
  minPredictedRating?: number;
  topN?: number;
}): Promise<RecommendationsResponse> {
  const searchParams = new URLSearchParams({
    metric: params.metric,
    k: String(params.k ?? 10),
    min_common_items: String(params.minCommonItems ?? 3),
    min_predicted_rating: String(params.minPredictedRating ?? 3.5),
    top_n: String(params.topN ?? 24),
  });

  const response = await fetch(
    `${API_BASE_URL}/recommendations/${params.userId}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`No se pudieron obtener recomendaciones para el usuario ${params.userId}.`);
  }

  return response.json();
}

export async function fetchUserSummary(userId: number): Promise<UserSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo obtener el resumen del usuario ${userId}.`);
  }

  return response.json();
}

// ── Graph API functions ───────────────────────────────────────────────────────

export async function fetchKnnGraph(
  metric: ApiMetric,
  mutualOnly = true,
): Promise<CytoscapeGraphResponse> {
  const params = new URLSearchParams({ metric, mutual_only: String(mutualOnly) });
  const response = await fetch(`${API_BASE_URL}/api/graph/knn?${params}`, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `Error al cargar el grafo KNN (${metric}).`);
  }
  return response.json();
}

export async function fetchMetricsSummary(): Promise<MetricsSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/graph/metrics-summary`, { cache: "no-store" });
  if (!response.ok) throw new Error("Error al cargar el resumen de métricas.");
  return response.json();
}

export async function fetchUserNeighborhood(
  userId: number,
  metric: ApiMetric,
  includeNeighborEdges = false,
): Promise<CytoscapeGraphResponse> {
  const params = new URLSearchParams({
    metric,
    include_neighbor_edges: String(includeNeighborEdges),
  });
  const response = await fetch(
    `${API_BASE_URL}/api/graph/users/${userId}/neighborhood?${params}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `Error al cargar la vecindad del usuario ${userId}.`);
  }
  return response.json();
}

export async function fetchCentralUsers(
  metric: ApiMetric,
  centrality: GraphCentrality = "pagerank",
  limit = 20,
): Promise<CentralUsersResponse> {
  const params = new URLSearchParams({ metric, centrality, limit: String(limit) });
  const response = await fetch(`${API_BASE_URL}/api/graph/central-users?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Error al cargar el ranking de usuarios centrales.");
  return response.json();
}

export function gephi_export_url(metric: ApiMetric, mutualOnly = true): string {
  return `${API_BASE_URL}/api/graph/export/gephi?metric=${metric}&mutual_only=${mutualOnly}`;
}
