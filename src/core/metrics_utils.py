from __future__ import annotations

import math
from typing import Dict, List, Tuple


UserRatings = Dict[int, Dict[int, float]]
CommonRatingPairs = List[Tuple[int, float, float]]


def get_common_rating_pairs(
    user_a_id: int,
    user_b_id: int,
    ratings_by_user: UserRatings,
) -> CommonRatingPairs:
    """
    Devuelve lista de tuplas:
    (movie_id, rating_user_a, rating_user_b)

    SOLO usa películas co-calificadas.
    """
    user_a_ratings = ratings_by_user.get(user_a_id, {})
    user_b_ratings = ratings_by_user.get(user_b_id, {})

    common_movie_ids = set(user_a_ratings.keys()) & set(user_b_ratings.keys())

    return [
        (movie_id, user_a_ratings[movie_id], user_b_ratings[movie_id])
        for movie_id in common_movie_ids
    ]


def get_common_movie_ids(
    user_a_id: int,
    user_b_id: int,
    ratings_by_user: UserRatings,
) -> List[int]:
    pairs = get_common_rating_pairs(user_a_id, user_b_id, ratings_by_user)
    return [movie_id for movie_id, _, _ in pairs]


def split_common_vectors(common_pairs: CommonRatingPairs) -> Tuple[List[float], List[float]]:
    vector_a = [rating_a for _, rating_a, _ in common_pairs]
    vector_b = [rating_b for _, _, rating_b in common_pairs]
    return vector_a, vector_b


def mean(values: List[float]) -> float:
    if not values:
        raise ValueError("No se puede calcular promedio de una lista vacía.")
    return sum(values) / len(values)


def dot_product(vector_a: List[float], vector_b: List[float]) -> float:
    return sum(a * b for a, b in zip(vector_a, vector_b))


def magnitude(vector: List[float]) -> float:
    return math.sqrt(sum(value * value for value in vector))

