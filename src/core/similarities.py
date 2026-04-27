from __future__ import annotations

import math
from typing import Dict

from src.core.metrics_utils import get_common_rating_pairs, mean, split_common_vectors


UserRatings = Dict[int, Dict[int, float]]


def euclidean_distance(
    user_a_id: int,
    user_b_id: int,
    ratings_by_user: UserRatings,
) -> float | None:
    common_pairs = get_common_rating_pairs(user_a_id, user_b_id, ratings_by_user)
    if not common_pairs:
        return None

    squared_sum = sum((rating_a - rating_b) ** 2 for _, rating_a, rating_b in common_pairs)
    return math.sqrt(squared_sum)


def manhattan_distance(
    user_a_id: int,
    user_b_id: int,
    ratings_by_user: UserRatings,
) -> float | None:
    common_pairs = get_common_rating_pairs(user_a_id, user_b_id, ratings_by_user)
    if not common_pairs:
        return None

    return sum(abs(rating_a - rating_b) for _, rating_a, rating_b in common_pairs)


def cosine_similarity(
    user_a_id: int,
    user_b_id: int,
    ratings_by_user: UserRatings,
) -> float | None:
    common_pairs = get_common_rating_pairs(user_a_id, user_b_id, ratings_by_user)
    if not common_pairs:
        return None

    vector_a, vector_b = split_common_vectors(common_pairs)
    numerator = sum(a * b for a, b in zip(vector_a, vector_b))
    denominator = math.sqrt(sum(a * a for a in vector_a)) * math.sqrt(
        sum(b * b for b in vector_b)
    )

    if denominator == 0:
        return None

    return numerator / denominator


def pearson_correlation(
    user_a_id: int,
    user_b_id: int,
    ratings_by_user: UserRatings,
) -> float | None:
    common_pairs = get_common_rating_pairs(user_a_id, user_b_id, ratings_by_user)
    if not common_pairs:
        return None

    vector_a, vector_b = split_common_vectors(common_pairs)
    mean_a = mean(vector_a)
    mean_b = mean(vector_b)

    centered_a = [value - mean_a for value in vector_a]
    centered_b = [value - mean_b for value in vector_b]

    numerator = sum(a * b for a, b in zip(centered_a, centered_b))
    denominator = math.sqrt(sum(a * a for a in centered_a)) * math.sqrt(
        sum(b * b for b in centered_b)
    )

    if denominator == 0:
        return None

    return numerator / denominator

