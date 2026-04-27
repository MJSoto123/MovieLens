from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


MetricName = Literal["pearson", "cosine", "euclidean", "manhattan"]


class HealthResponse(BaseModel):
    status: str = "ok"
    dataset: str


class UserSummaryResponse(BaseModel):
    user_id: int
    ratings_count: int
    average_rating: float | None


class RecommendationQuery(BaseModel):
    metric: MetricName = "pearson"
    k: int = Field(default=5, gt=0)
    min_common_items: int = Field(default=1, ge=1)
    min_predicted_rating: float = Field(default=0.0, ge=0.0)
    top_n: int = Field(default=10, gt=0)


class CreateUserResponse(BaseModel):
    user_id: int
    is_active: bool = True


class UserRatingInput(BaseModel):
    movie_id: int = Field(gt=0)
    rating: float = Field(ge=0.5, le=5.0)
    timestamp: int | None = None


class AddRatingsRequest(BaseModel):
    ratings: list[UserRatingInput]


class ActivationResponse(BaseModel):
    user_id: int
    is_active: bool
