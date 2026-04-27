from __future__ import annotations

from typing import Callable, Dict, List, Literal, TypedDict

from src.core.metrics_utils import get_common_rating_pairs
from src.core.similarities import (
    cosine_similarity,
    euclidean_distance,
    manhattan_distance,
    pearson_correlation,
)


UserRatings = Dict[int, Dict[int, float]]
MetricName = Literal["euclidean", "manhattan", "cosine", "pearson"]


class NeighborResult(TypedDict):
    user_id: int
    score: float
    common_items: int
    metric: str


METRIC_FUNCTIONS: Dict[MetricName, Callable[[int, int, UserRatings], float | None]] = {
    "euclidean": euclidean_distance,
    "manhattan": manhattan_distance,
    "cosine": cosine_similarity,
    "pearson": pearson_correlation,
}

SIMILARITY_METRICS = {"cosine", "pearson"}
DISTANCE_METRICS = {"euclidean", "manhattan"}


def calculate_neighbor_scores(
    target_user_id: int,
    ratings_by_user: UserRatings,
    metric: MetricName = "pearson",
    min_common_items: int = 1,
) -> List[NeighborResult]:
    if metric not in METRIC_FUNCTIONS:
        raise ValueError(f"Métrica no soportada: {metric}")

    if target_user_id not in ratings_by_user:
        raise ValueError(f"El usuario objetivo {target_user_id} no existe.")

    metric_function = METRIC_FUNCTIONS[metric]
    results: List[NeighborResult] = []

    for other_user_id in ratings_by_user:
        if other_user_id == target_user_id:
            continue

        common_pairs = get_common_rating_pairs(target_user_id, other_user_id, ratings_by_user)
        common_items = len(common_pairs)

        if common_items < min_common_items:
            continue

        score = metric_function(target_user_id, other_user_id, ratings_by_user)
        if score is None:
            continue

        results.append(
            {
                "user_id": other_user_id,
                "score": score,
                "common_items": common_items,
                "metric": metric,
            }
        )

    return sort_neighbors(results, metric)


def sort_neighbors(
    neighbors: List[NeighborResult],
    metric: MetricName,
) -> List[NeighborResult]:
    reverse = metric in SIMILARITY_METRICS
    return sorted(neighbors, key=lambda item: item["score"], reverse=reverse)


def get_top_k_neighbors(
    target_user_id: int,
    ratings_by_user: UserRatings,
    k: int,
    metric: MetricName = "pearson",
    min_common_items: int = 1,
) -> List[NeighborResult]:
    if k <= 0:
        raise ValueError("k debe ser mayor que 0.")

    neighbors = calculate_neighbor_scores(
        target_user_id=target_user_id,
        ratings_by_user=ratings_by_user,
        metric=metric,
        min_common_items=min_common_items,
    )
    return neighbors[:k]

