from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Iterable, List

from src.core.neighbors import MetricName, get_top_k_neighbors
from src.core.prediction import recommend_movies
from src.data.loader import MovieRow, RatingRow, load_links, load_movies, load_ratings
from src.data.transforms import (
    build_movie_titles,
    build_ratings_by_movie,
    build_ratings_by_user,
    merge_movies_with_links,
)


class RecommendationEngine:
    def __init__(self, ratings: Iterable[RatingRow], movies: Iterable[MovieRow]) -> None:
        self.ratings = list(ratings)
        self.movies = list(movies)
        self._rebuild_indexes()

    @classmethod
    def from_csv_paths(
        cls,
        ratings_path: str | Path,
        movies_path: str | Path,
        links_path: str | Path | None = None,
    ) -> "RecommendationEngine":
        ratings = load_ratings(Path(ratings_path))
        movies = load_movies(Path(movies_path))
        if links_path is not None and Path(links_path).exists():
            links = load_links(Path(links_path))
            movies = merge_movies_with_links(movies, links)
        return cls(ratings=ratings, movies=movies)

    def _rebuild_indexes(self) -> None:
        self.ratings_by_user = build_ratings_by_user(self.ratings)
        self.ratings_by_movie = build_ratings_by_movie(self.ratings)
        self.movie_titles = build_movie_titles(self.movies)
        self.movies_by_id = {
            int(movie["movieId"]): {
                "movieId": int(movie["movieId"]),
                "title": str(movie["title"]),
                "genres": str(movie["genres"]),
                "imdbId": int(movie["imdbId"]) if movie.get("imdbId") is not None else None,
                "tmdbId": int(movie["tmdbId"]) if movie.get("tmdbId") is not None else None,
            }
            for movie in self.movies
        }

    def reload_data(self, ratings: Iterable[RatingRow], movies: Iterable[MovieRow]) -> None:
        self.ratings = list(ratings)
        self.movies = list(movies)
        self._rebuild_indexes()

    def get_neighbors(
        self,
        target_user_id: int,
        k: int,
        metric: MetricName = "pearson",
        min_common_items: int = 1,
    ) -> List[Dict[str, Any]]:
        return get_top_k_neighbors(
            target_user_id=target_user_id,
            ratings_by_user=self.ratings_by_user,
            k=k,
            metric=metric,
            min_common_items=min_common_items,
        )

    def get_recommendations(
        self,
        target_user_id: int,
        k: int,
        metric: MetricName = "pearson",
        min_common_items: int = 1,
        min_predicted_rating: float = 0.0,
        top_n: int = 10,
    ) -> List[Dict[str, Any]]:
        predictions = recommend_movies(
            target_user_id=target_user_id,
            ratings_by_user=self.ratings_by_user,
            k=k,
            metric=metric,
            min_common_items=min_common_items,
            min_predicted_rating=min_predicted_rating,
        )

        enriched_predictions: List[Dict[str, Any]] = []
        for prediction in predictions[:top_n]:
            movie_id = prediction["movie_id"]
            movie = self.movies_by_id.get(movie_id, {})
            enriched_predictions.append(
                {
                    "movie_id": movie_id,
                    "title": self.movie_titles.get(movie_id, f"Movie {movie_id}"),
                    "genres": movie.get("genres", ""),
                    "imdb_id": movie.get("imdbId"),
                    "tmdb_id": movie.get("tmdbId"),
                    "predicted_rating": prediction["predicted_rating"],
                    "supporting_neighbors": prediction["supporting_neighbors"],
                }
            )

        return enriched_predictions
