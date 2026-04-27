from __future__ import annotations

import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data.loader import load_links, load_movies, load_ratings
from src.data.transforms import merge_movies_with_links
from src.storage.repository import PostgresRepository


def main() -> None:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL no está configurada.")

    dataset_dir = Path(os.getenv("DATASET_DIR", "data/raw/ml-latest-small"))
    ratings = load_ratings(dataset_dir / "ratings.csv")
    movies = load_movies(dataset_dir / "movies.csv")
    links = load_links(dataset_dir / "links.csv")
    merged_movies = merge_movies_with_links(movies, links)

    repository = PostgresRepository(database_url)
    repository.bootstrap_schema()
    repository.seed_from_rows(movies=merged_movies, ratings=ratings)

    print(
        f"Seed completado: {len(merged_movies)} películas y {len(ratings)} ratings cargados desde {dataset_dir}."
    )


if __name__ == "__main__":
    main()
