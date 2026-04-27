from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


TMDB_API_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"


class TmdbService:
    def __init__(
        self,
        api_key: str | None = None,
        bearer_token: str | None = None,
        image_size: str = "w342",
    ) -> None:
        self.api_key = api_key or os.getenv("TMDB_API_KEY")
        self.bearer_token = bearer_token or os.getenv("TMDB_BEARER_TOKEN")
        self.image_size = image_size

    def is_enabled(self) -> bool:
        return bool(self.api_key or self.bearer_token)

    @lru_cache(maxsize=2048)
    def get_poster_url(self, tmdb_id: int | None) -> str | None:
        if not tmdb_id or not self.is_enabled():
            return None

        movie_payload = self._fetch_movie(tmdb_id)
        poster_path = movie_payload.get("poster_path")
        if not poster_path:
            return None

        return f"{TMDB_IMAGE_BASE_URL}/{self.image_size}{poster_path}"

    def _fetch_movie(self, tmdb_id: int) -> dict[str, Any]:
        query_params = {"language": "en-US"}
        if self.api_key:
            query_params["api_key"] = self.api_key

        request = Request(
            url=f"{TMDB_API_BASE_URL}/movie/{tmdb_id}?{urlencode(query_params)}",
            headers=self._headers(),
        )

        try:
            with urlopen(request, timeout=10) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            return {}

    def _headers(self) -> dict[str, str]:
        headers = {
            "accept": "application/json",
        }
        if self.bearer_token:
            headers["Authorization"] = f"Bearer {self.bearer_token}"
        return headers
