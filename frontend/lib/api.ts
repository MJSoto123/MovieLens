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
