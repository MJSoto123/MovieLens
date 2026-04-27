from __future__ import annotations

from typing import Dict, Iterable, List, Literal, TypedDict

from src.core.filtering import get_candidate_movie_ids_from_neighbors
from src.core.neighbors import MetricName, NeighborResult, get_top_k_neighbors


UserRatings = Dict[int, Dict[int, float]]


class PredictionResult(TypedDict):
    movie_id: int
    predicted_rating: float
    supporting_neighbors: int


def _neighbor_weight(metric: MetricName, raw_score: float) -> float | None:
    if metric in {"cosine", "pearson"}:
        if raw_score <= 0:
            return None
        return raw_score

    return 1 / (1 + raw_score)


def predict_rating_for_movie(
    target_user_id: int,
    movie_id: int,
    neighbors: Iterable[NeighborResult],
    ratings_by_user: UserRatings,
    metric: MetricName,
) -> float | None:
    weighted_sum = 0.0
    weight_sum = 0.0

    for neighbor in neighbors:
        neighbor_id = neighbor["user_id"]
        neighbor_ratings = ratings_by_user.get(neighbor_id, {})

        if movie_id not in neighbor_ratings:
            continue

        weight = _neighbor_weight(metric, neighbor["score"])
        if weight is None:
            continue

        weighted_sum += weight * neighbor_ratings[movie_id]
        weight_sum += weight

    if weight_sum == 0:
        return None

    return weighted_sum / weight_sum


def recommend_movies(
    target_user_id: int,
    ratings_by_user: UserRatings,
    k: int,
    metric: MetricName = "pearson",
    min_common_items: int = 1,
    min_predicted_rating: float = 0.0,
) -> List[PredictionResult]:
    neighbors = get_top_k_neighbors(
        target_user_id=target_user_id,
        ratings_by_user=ratings_by_user,
        k=k,
        metric=metric,
        min_common_items=min_common_items,
    )

    candidate_movie_ids = get_candidate_movie_ids_from_neighbors(
        target_user_id=target_user_id,
        neighbor_ids=[neighbor["user_id"] for neighbor in neighbors],
        ratings_by_user=ratings_by_user,
    )

    predictions: List[PredictionResult] = []

    for movie_id in candidate_movie_ids:
        predicted_rating = predict_rating_for_movie(
            target_user_id=target_user_id,
            movie_id=movie_id,
            neighbors=neighbors,
            ratings_by_user=ratings_by_user,
            metric=metric,
        )

        if predicted_rating is None:
            continue

        if predicted_rating < min_predicted_rating:
            continue

        supporting_neighbors = sum(
            1
            for neighbor in neighbors
            if movie_id in ratings_by_user.get(neighbor["user_id"], {})
        )

        predictions.append(
            {
                "movie_id": movie_id,
                "predicted_rating": predicted_rating,
                "supporting_neighbors": supporting_neighbors,
            }
        )

    return sorted(
        predictions,
        key=lambda item: (item["predicted_rating"], item["supporting_neighbors"]),
        reverse=True,
    )
