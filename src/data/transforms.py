from __future__ import annotations

from typing import Dict, Iterable, List, Set

from src.data.loader import LinkRow, MovieRow, RatingRow


RatingsByUser = Dict[int, Dict[int, float]]
RatingsByMovie = Dict[int, Dict[int, float]]
MovieTitles = Dict[int, str]


def build_ratings_by_user(ratings: Iterable[RatingRow]) -> RatingsByUser:
    """
    Estructura principal para user-based kNN:
    {user_id: {movie_id: rating}}
    """
    result: RatingsByUser = {}

    for row in ratings:
        user_id = int(row["userId"])
        movie_id = int(row["movieId"])
        rating = float(row["rating"])

        if user_id not in result:
            result[user_id] = {}

        result[user_id][movie_id] = rating

    return result


def build_ratings_by_movie(ratings: Iterable[RatingRow]) -> RatingsByMovie:
    """
    Estructura auxiliar:
    {movie_id: {user_id: rating}}
    """
    result: RatingsByMovie = {}

    for row in ratings:
        user_id = int(row["userId"])
        movie_id = int(row["movieId"])
        rating = float(row["rating"])

        if movie_id not in result:
            result[movie_id] = {}

        result[movie_id][user_id] = rating

    return result


def build_movie_titles(movies: Iterable[MovieRow]) -> MovieTitles:
    return {int(movie["movieId"]): str(movie["title"]) for movie in movies}


def get_all_movie_ids(ratings_by_movie: RatingsByMovie) -> Set[int]:
    return set(ratings_by_movie.keys())


def get_user_ids(ratings_by_user: RatingsByUser) -> List[int]:
    return sorted(ratings_by_user.keys())


def merge_movies_with_links(
    movies: Iterable[MovieRow],
    links: Iterable[LinkRow],
) -> List[MovieRow]:
    links_by_movie_id = {int(link["movieId"]): link for link in links}
    merged_movies: List[MovieRow] = []

    for movie in movies:
        movie_id = int(movie["movieId"])
        link = links_by_movie_id.get(movie_id, {})
        merged_movies.append(
            {
                "movieId": movie_id,
                "title": str(movie["title"]),
                "genres": str(movie["genres"]),
                "imdbId": link.get("imdbId"),
                "tmdbId": link.get("tmdbId"),
            }
        )

    return merged_movies
