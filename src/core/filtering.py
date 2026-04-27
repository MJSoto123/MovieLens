from __future__ import annotations

from typing import Dict, Iterable, List, Set


UserRatings = Dict[int, Dict[int, float]]


def get_unseen_movie_ids(
    target_user_id: int,
    ratings_by_user: UserRatings,
    all_movie_ids: Iterable[int],
) -> List[int]:
    seen_movie_ids = set(ratings_by_user.get(target_user_id, {}).keys())
    return sorted(movie_id for movie_id in all_movie_ids if movie_id not in seen_movie_ids)


def get_candidate_movie_ids_from_neighbors(
    target_user_id: int,
    neighbor_ids: Iterable[int],
    ratings_by_user: UserRatings,
) -> List[int]:
    target_seen = set(ratings_by_user.get(target_user_id, {}).keys())
    candidate_movie_ids: Set[int] = set()

    for neighbor_id in neighbor_ids:
        neighbor_ratings = ratings_by_user.get(neighbor_id, {})
        for movie_id in neighbor_ratings:
            if movie_id not in target_seen:
                candidate_movie_ids.add(movie_id)

    return sorted(candidate_movie_ids)

