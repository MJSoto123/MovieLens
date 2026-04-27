from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row

from src.data.loader import MovieRow, RatingRow


class PostgresRepository:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    @contextmanager
    def _connection(self) -> Iterator[psycopg.Connection[Any]]:
        with psycopg.connect(self.database_url, row_factory=dict_row) as connection:
            yield connection

    def bootstrap_schema(self) -> None:
        statements = [
            """
            CREATE TABLE IF NOT EXISTS users (
              user_id INTEGER PRIMARY KEY,
              is_active BOOLEAN NOT NULL DEFAULT TRUE,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS movies (
              movie_id INTEGER PRIMARY KEY,
              title TEXT NOT NULL,
              genres TEXT NOT NULL,
              imdb_id INTEGER,
              tmdb_id INTEGER
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS ratings (
              user_id INTEGER NOT NULL REFERENCES users(user_id),
              movie_id INTEGER NOT NULL REFERENCES movies(movie_id),
              rating NUMERIC(3,1) NOT NULL,
              rated_at TIMESTAMPTZ,
              source_timestamp BIGINT,
              PRIMARY KEY (user_id, movie_id)
            )
            """,
            """
            ALTER TABLE ratings
            ADD COLUMN IF NOT EXISTS source_timestamp BIGINT
            """,
            """
            ALTER TABLE movies
            ADD COLUMN IF NOT EXISTS imdb_id INTEGER
            """,
            """
            ALTER TABLE movies
            ADD COLUMN IF NOT EXISTS tmdb_id INTEGER
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id)
            """,
        ]

        with self._connection() as connection:
            with connection.cursor() as cursor:
                for statement in statements:
                    cursor.execute(statement)
                connection.commit()

    def fetch_movies(self) -> list[MovieRow]:
        query = """
            SELECT
                movie_id AS "movieId",
                title,
                genres,
                imdb_id AS "imdbId",
                tmdb_id AS "tmdbId"
            FROM movies
            ORDER BY movie_id
        """
        with self._connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query)
                return list(cursor.fetchall())

    def fetch_active_ratings(self) -> list[RatingRow]:
        query = """
            SELECT
                r.user_id AS "userId",
                r.movie_id AS "movieId",
                r.rating AS rating,
                COALESCE(r.source_timestamp, 0) AS timestamp
            FROM ratings r
            JOIN users u ON u.user_id = r.user_id
            WHERE u.is_active = TRUE
            ORDER BY r.user_id, r.movie_id
        """
        with self._connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query)
                rows = cursor.fetchall()
                return [
                    {
                        "userId": int(row["userId"]),
                        "movieId": int(row["movieId"]),
                        "rating": float(row["rating"]),
                        "timestamp": int(row["timestamp"]),
                    }
                    for row in rows
                ]

    def get_user_summary(self, user_id: int) -> dict[str, Any] | None:
        query = """
            SELECT
                u.user_id,
                u.is_active,
                COUNT(r.movie_id) AS ratings_count,
                AVG(r.rating) AS average_rating
            FROM users u
            LEFT JOIN ratings r ON r.user_id = u.user_id
            WHERE u.user_id = %(user_id)s
            GROUP BY u.user_id, u.is_active
        """
        with self._connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, {"user_id": user_id})
                row = cursor.fetchone()
                if row is None:
                    return None
                return dict(row)

    def list_user_ids(self, limit: int) -> list[int]:
        query = """
            SELECT user_id
            FROM users
            WHERE is_active = TRUE
            ORDER BY user_id
            LIMIT %(limit)s
        """
        with self._connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, {"limit": limit})
                return [int(row["user_id"]) for row in cursor.fetchall()]

    def create_user(self) -> int:
        query = """
            INSERT INTO users (user_id, is_active)
            VALUES (
                COALESCE((SELECT MAX(user_id) + 1 FROM users), 1),
                TRUE
            )
            RETURNING user_id
        """
        with self._connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query)
                user_id = int(cursor.fetchone()["user_id"])
                connection.commit()
                return user_id

    def upsert_user_ratings(self, user_id: int, ratings: list[dict[str, Any]]) -> None:
        query = """
            INSERT INTO ratings (user_id, movie_id, rating, source_timestamp)
            VALUES (%(user_id)s, %(movie_id)s, %(rating)s, %(timestamp)s)
            ON CONFLICT (user_id, movie_id)
            DO UPDATE SET
                rating = EXCLUDED.rating,
                source_timestamp = EXCLUDED.source_timestamp
        """
        with self._connection() as connection:
            with connection.cursor() as cursor:
                cursor.executemany(
                    query,
                    [
                        {
                            "user_id": user_id,
                            "movie_id": rating["movie_id"],
                            "rating": rating["rating"],
                            "timestamp": rating.get("timestamp"),
                        }
                        for rating in ratings
                    ],
                )
                connection.commit()

    def set_user_active(self, user_id: int, is_active: bool) -> bool:
        query = """
            UPDATE users
            SET is_active = %(is_active)s
            WHERE user_id = %(user_id)s
            RETURNING user_id
        """
        with self._connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, {"user_id": user_id, "is_active": is_active})
                row = cursor.fetchone()
                connection.commit()
                return row is not None

    def seed_from_rows(self, movies: list[MovieRow], ratings: list[RatingRow]) -> None:
        with self._connection() as connection:
            with connection.cursor() as cursor:
                cursor.executemany(
                    """
                    INSERT INTO movies (movie_id, title, genres, imdb_id, tmdb_id)
                    VALUES (%(movieId)s, %(title)s, %(genres)s, %(imdbId)s, %(tmdbId)s)
                    ON CONFLICT (movie_id)
                    DO UPDATE SET
                        title = EXCLUDED.title,
                        genres = EXCLUDED.genres,
                        imdb_id = EXCLUDED.imdb_id,
                        tmdb_id = EXCLUDED.tmdb_id
                    """,
                    movies,
                )

                user_rows = [{"user_id": int(row["userId"])} for row in ratings]
                cursor.executemany(
                    """
                    INSERT INTO users (user_id, is_active)
                    VALUES (%(user_id)s, TRUE)
                    ON CONFLICT (user_id)
                    DO UPDATE SET is_active = TRUE
                    """,
                    user_rows,
                )

                cursor.executemany(
                    """
                    INSERT INTO ratings (user_id, movie_id, rating, source_timestamp)
                    VALUES (%(userId)s, %(movieId)s, %(rating)s, %(timestamp)s)
                    ON CONFLICT (user_id, movie_id)
                    DO UPDATE SET
                        rating = EXCLUDED.rating,
                        source_timestamp = EXCLUDED.source_timestamp
                    """,
                    ratings,
                )
                connection.commit()
