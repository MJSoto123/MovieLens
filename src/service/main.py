from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.service.schemas import (
    ActivationResponse,
    AddRatingsRequest,
    CreateUserResponse,
    HealthResponse,
    MetricName,
    UserSummaryResponse,
)
from src.service.routers.graph import router as graph_router
from src.service.services.recommendation_service import RecommendationEngine
from src.service.services.tmdb_service import TmdbService
from src.storage.repository import PostgresRepository


def _default_data_path() -> Path:
    return Path(os.getenv("DATASET_DIR", "data/raw/ml-latest-small"))


def _database_url() -> str | None:
    return os.getenv("DATABASE_URL")


def get_repository() -> PostgresRepository | None:
    database_url = _database_url()
    if not database_url:
        return None
    repository = PostgresRepository(database_url)
    repository.bootstrap_schema()
    return repository


@lru_cache(maxsize=1)
def get_engine() -> RecommendationEngine:
    repository = get_repository()
    if repository is not None:
        ratings = repository.fetch_active_ratings()
        movies = repository.fetch_movies()
        return RecommendationEngine(ratings=ratings, movies=movies)

    dataset_dir = _default_data_path()
    ratings_path = dataset_dir / "ratings.csv"
    movies_path = dataset_dir / "movies.csv"
    links_path = dataset_dir / "links.csv"
    return RecommendationEngine.from_csv_paths(
        ratings_path=ratings_path,
        movies_path=movies_path,
        links_path=links_path,
    )


@lru_cache(maxsize=1)
def get_tmdb_service() -> TmdbService:
    return TmdbService(image_size=os.getenv("TMDB_IMAGE_SIZE", "w342"))


app = FastAPI(
    title="MovieLens Recommender API",
    version="0.1.0",
    description="API inicial para recomendaciones y pruebas de Docker.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router, prefix="/api")


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    source = "postgres" if get_repository() is not None else str(_default_data_path())
    return HealthResponse(status="ok", dataset=source)


@app.get("/metrics")
def list_metrics() -> dict[str, list[str]]:
    return {"metrics": ["pearson", "cosine", "euclidean", "manhattan"]}


@app.get("/users")
def list_users(limit: int = Query(default=20, ge=1, le=200)) -> dict[str, Any]:
    repository = get_repository()
    if repository is not None:
        user_ids = repository.list_user_ids(limit=limit)
    else:
        engine = get_engine()
        user_ids = sorted(engine.ratings_by_user.keys())[:limit]
    return {"users": user_ids, "count": len(user_ids)}


@app.get("/users/{user_id}", response_model=UserSummaryResponse)
def get_user(user_id: int) -> UserSummaryResponse:
    repository = get_repository()
    if repository is not None:
        summary = repository.get_user_summary(user_id)
        if summary is None:
            raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado.")
        return UserSummaryResponse(
            user_id=int(summary["user_id"]),
            ratings_count=int(summary["ratings_count"]),
            average_rating=float(summary["average_rating"]) if summary["average_rating"] is not None else None,
        )

    engine = get_engine()
    ratings = engine.ratings_by_user.get(user_id)
    if ratings is None:
        raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado.")

    values = list(ratings.values())
    average = sum(values) / len(values) if values else None
    return UserSummaryResponse(user_id=user_id, ratings_count=len(values), average_rating=average)


@app.get("/recommendations/{user_id}")
def get_recommendations(
    user_id: int,
    metric: MetricName = Query(default="pearson"),
    k: int = Query(default=5, ge=1),
    min_common_items: int = Query(default=1, ge=1),
    min_predicted_rating: float = Query(default=0.0, ge=0.0),
    top_n: int = Query(default=10, ge=1, le=100),
) -> dict[str, Any]:
    engine = get_engine()
    if user_id not in engine.ratings_by_user:
        raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado.")

    neighbors = engine.get_neighbors(
        target_user_id=user_id,
        k=k,
        metric=metric,
        min_common_items=min_common_items,
    )
    recommendations = engine.get_recommendations(
        target_user_id=user_id,
        k=k,
        metric=metric,
        min_common_items=min_common_items,
        min_predicted_rating=min_predicted_rating,
        top_n=top_n,
    )
    tmdb_service = get_tmdb_service()
    enriched_recommendations = [
        {
            **recommendation,
            "poster_url": tmdb_service.get_poster_url(recommendation.get("tmdb_id")),
        }
        for recommendation in recommendations
    ]

    return {
        "user_id": user_id,
        "metric": metric,
        "neighbors": neighbors,
        "recommendations": enriched_recommendations,
    }


@app.post("/engine/reload")
def reload_engine() -> dict[str, str]:
    get_engine.cache_clear()
    get_engine()
    return {"status": "reloaded"}


@app.post("/users", response_model=CreateUserResponse)
def create_user() -> CreateUserResponse:
    repository = get_repository()
    if repository is None:
        raise HTTPException(status_code=400, detail="La creación de usuarios requiere DATABASE_URL.")

    user_id = repository.create_user()
    get_engine.cache_clear()
    return CreateUserResponse(user_id=user_id, is_active=True)


@app.post("/users/{user_id}/ratings")
def add_user_ratings(user_id: int, payload: AddRatingsRequest) -> dict[str, Any]:
    repository = get_repository()
    if repository is None:
        raise HTTPException(status_code=400, detail="Agregar ratings requiere DATABASE_URL.")

    summary = repository.get_user_summary(user_id)
    if summary is None:
        raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado.")

    repository.upsert_user_ratings(
        user_id=user_id,
        ratings=[
            {
                "movie_id": item.movie_id,
                "rating": item.rating,
                "timestamp": item.timestamp,
            }
            for item in payload.ratings
        ],
    )
    get_engine.cache_clear()
    return {"status": "ok", "user_id": user_id, "ratings_upserted": len(payload.ratings)}


@app.post("/users/{user_id}/deactivate", response_model=ActivationResponse)
def deactivate_user(user_id: int) -> ActivationResponse:
    repository = get_repository()
    if repository is None:
        raise HTTPException(status_code=400, detail="Desactivar usuarios requiere DATABASE_URL.")

    updated = repository.set_user_active(user_id=user_id, is_active=False)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado.")
    get_engine.cache_clear()
    return ActivationResponse(user_id=user_id, is_active=False)


@app.post("/users/{user_id}/activate", response_model=ActivationResponse)
def activate_user(user_id: int) -> ActivationResponse:
    repository = get_repository()
    if repository is None:
        raise HTTPException(status_code=400, detail="Activar usuarios requiere DATABASE_URL.")

    updated = repository.set_user_active(user_id=user_id, is_active=True)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado.")
    get_engine.cache_clear()
    return ActivationResponse(user_id=user_id, is_active=True)
