from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List


RatingRow = Dict[str, int | float | None]
MovieRow = Dict[str, int | str | None]
LinkRow = Dict[str, int | None]


def _resolve_path(file_path: str | Path) -> Path:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"No se encontró el archivo: {path}")
    return path


def load_ratings(file_path: str | Path) -> List[RatingRow]:
    """
    Carga ratings desde CSV.

    Salida por fila:
    {
        "userId": int,
        "movieId": int,
        "rating": float,
        "timestamp": int,
    }
    """
    path = _resolve_path(file_path)
    ratings: List[RatingRow] = []

    with path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            ratings.append(
                {
                    "userId": int(row["userId"]),
                    "movieId": int(row["movieId"]),
                    "rating": float(row["rating"]),
                    "timestamp": int(row["timestamp"]),
                }
            )

    return ratings


def load_movies(file_path: str | Path) -> List[MovieRow]:
    """
    Carga películas desde CSV.

    Salida por fila:
    {
        "movieId": int,
        "title": str,
        "genres": str,
    }
    """
    path = _resolve_path(file_path)
    movies: List[MovieRow] = []

    with path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            movies.append(
                {
                    "movieId": int(row["movieId"]),
                    "title": row["title"],
                    "genres": row["genres"],
                }
            )

    return movies


def load_links(file_path: str | Path) -> List[LinkRow]:
    """
    Carga links.csv y devuelve:
    {
        "movieId": int,
        "imdbId": int | None,
        "tmdbId": int | None,
    }
    """
    path = _resolve_path(file_path)
    links: List[LinkRow] = []

    with path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            imdb_id = row.get("imdbId")
            tmdb_id = row.get("tmdbId")
            links.append(
                {
                    "movieId": int(row["movieId"]),
                    "imdbId": int(imdb_id) if imdb_id else None,
                    "tmdbId": int(float(tmdb_id)) if tmdb_id else None,
                }
            )

    return links
