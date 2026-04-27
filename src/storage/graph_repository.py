from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row


class GraphRepository:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    @contextmanager
    def _connection(self) -> Iterator[psycopg.Connection[Any]]:
        with psycopg.connect(self.database_url, row_factory=dict_row) as connection:
            yield connection

    # ── schema ───────────────────────────────────────────────────────────────

    def bootstrap_graph_schema(self) -> None:
        statements = [
            """
            CREATE TABLE IF NOT EXISTS graph_runs (
                id          BIGSERIAL PRIMARY KEY,
                metric      TEXT NOT NULL CHECK (metric IN ('pearson','cosine','euclidean','manhattan')),
                k           INTEGER NOT NULL DEFAULT 10,
                status      TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','running','completed','failed')),
                is_active   BOOLEAN NOT NULL DEFAULT FALSE,
                started_at  TIMESTAMPTZ,
                finished_at TIMESTAMPTZ,
                total_users INTEGER,
                total_edges INTEGER,
                notes       TEXT,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_graph_runs_active_metric
                ON graph_runs (metric) WHERE is_active = TRUE
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_graph_runs_metric_status
                ON graph_runs (metric, status)
            """,
            """
            CREATE TABLE IF NOT EXISTS user_knn_neighbors (
                id               BIGSERIAL PRIMARY KEY,
                run_id           BIGINT NOT NULL REFERENCES graph_runs(id) ON DELETE CASCADE,
                user_id          INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                neighbor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                metric           TEXT NOT NULL,
                raw_value        DOUBLE PRECISION NOT NULL,
                similarity_score DOUBLE PRECISION NOT NULL,
                rank             INTEGER NOT NULL,
                created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (run_id, user_id, neighbor_user_id)
            )
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_knn_run_user
                ON user_knn_neighbors (run_id, user_id)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_knn_run_metric
                ON user_knn_neighbors (run_id, metric)
            """,
            """
            CREATE TABLE IF NOT EXISTS graph_edges (
                id               BIGSERIAL PRIMARY KEY,
                run_id           BIGINT NOT NULL REFERENCES graph_runs(id) ON DELETE CASCADE,
                source_user_id   INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                target_user_id   INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                metric           TEXT NOT NULL,
                weight           DOUBLE PRECISION NOT NULL,
                similarity_score DOUBLE PRECISION NOT NULL,
                rank             INTEGER NOT NULL,
                is_mutual        BOOLEAN NOT NULL DEFAULT FALSE,
                direction_type   TEXT NOT NULL DEFAULT 'directed'
                                 CHECK (direction_type IN ('directed','undirected')),
                created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (run_id, source_user_id, target_user_id)
            )
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_edges_run_source
                ON graph_edges (run_id, source_user_id)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_edges_run_target
                ON graph_edges (run_id, target_user_id)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_edges_run_mutual
                ON graph_edges (run_id, is_mutual)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_edges_run_metric
                ON graph_edges (run_id, metric)
            """,
            """
            CREATE TABLE IF NOT EXISTS user_graph_metrics (
                id               BIGSERIAL PRIMARY KEY,
                run_id           BIGINT NOT NULL REFERENCES graph_runs(id) ON DELETE CASCADE,
                user_id          INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                metric           TEXT NOT NULL,
                degree           INTEGER NOT NULL DEFAULT 0,
                weighted_degree  DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                betweenness      DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                closeness        DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                pagerank         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                avg_similarity   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                community_id     INTEGER,
                created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (run_id, user_id, metric)
            )
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_ugm_run_metric
                ON user_graph_metrics (run_id, metric)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_ugm_run_community
                ON user_graph_metrics (run_id, community_id)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_ugm_pagerank
                ON user_graph_metrics (run_id, metric, pagerank DESC)
            """,
            """
            CREATE TABLE IF NOT EXISTS graph_communities (
                id             BIGSERIAL PRIMARY KEY,
                run_id         BIGINT NOT NULL REFERENCES graph_runs(id) ON DELETE CASCADE,
                metric         TEXT NOT NULL,
                community_id   INTEGER NOT NULL,
                size           INTEGER NOT NULL DEFAULT 0,
                avg_similarity DOUBLE PRECISION,
                top_genres     TEXT,
                created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (run_id, metric, community_id)
            )
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_communities_run_metric
                ON graph_communities (run_id, metric)
            """,
            """
            CREATE TABLE IF NOT EXISTS graph_metric_summaries (
                id                   BIGSERIAL PRIMARY KEY,
                run_id               BIGINT NOT NULL REFERENCES graph_runs(id) ON DELETE CASCADE,
                metric               TEXT NOT NULL,
                nodes_count          INTEGER NOT NULL DEFAULT 0,
                edges_count          INTEGER NOT NULL DEFAULT 0,
                mutual_edges_count   INTEGER NOT NULL DEFAULT 0,
                density              DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                avg_weight           DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                communities_count    INTEGER NOT NULL DEFAULT 0,
                avg_degree           DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                avg_weighted_degree  DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                avg_pagerank         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                avg_betweenness      DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                avg_closeness        DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                modularity           DOUBLE PRECISION,
                created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (run_id, metric)
            )
            """,
        ]
        with self._connection() as conn:
            with conn.cursor() as cur:
                for stmt in statements:
                    cur.execute(stmt)
                conn.commit()

    # ── graph_runs ────────────────────────────────────────────────────────────

    def create_run(self, metric: str, k: int, total_users: int) -> int:
        query = """
            INSERT INTO graph_runs (metric, k, status, started_at, total_users)
            VALUES (%(metric)s, %(k)s, 'pending', NOW(), %(total_users)s)
            RETURNING id
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"metric": metric, "k": k, "total_users": total_users})
                run_id = int(cur.fetchone()["id"])
                conn.commit()
                return run_id

    def update_run_status(
        self,
        run_id: int,
        status: str,
        total_edges: int | None = None,
        notes: str | None = None,
    ) -> None:
        query = """
            UPDATE graph_runs
            SET status = %(status)s,
                finished_at = CASE WHEN %(status)s IN ('completed','failed') THEN NOW() ELSE finished_at END,
                total_edges = COALESCE(%(total_edges)s, total_edges),
                notes = COALESCE(%(notes)s, notes)
            WHERE id = %(run_id)s
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, "status": status, "total_edges": total_edges, "notes": notes})
                conn.commit()

    def set_active_run(self, metric: str, run_id: int) -> None:
        """Desactiva el run previo y activa el nuevo para una métrica."""
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE graph_runs SET is_active = FALSE WHERE metric = %(metric)s AND is_active = TRUE",
                    {"metric": metric},
                )
                cur.execute(
                    "UPDATE graph_runs SET is_active = TRUE WHERE id = %(run_id)s",
                    {"run_id": run_id},
                )
                conn.commit()

    def get_active_run(self, metric: str) -> dict[str, Any] | None:
        query = """
            SELECT id, metric, k, status, is_active, total_users, total_edges, created_at
            FROM graph_runs
            WHERE metric = %(metric)s AND is_active = TRUE
            LIMIT 1
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"metric": metric})
                row = cur.fetchone()
                return dict(row) if row else None

    def count_edges(self, run_id: int) -> int:
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS n FROM graph_edges WHERE run_id = %(run_id)s", {"run_id": run_id})
                return int(cur.fetchone()["n"])

    # ── user_knn_neighbors ────────────────────────────────────────────────────

    def save_knn_neighbors(
        self,
        run_id: int,
        metric: str,
        neighbors_by_user: dict[int, list[dict[str, Any]]],
    ) -> None:
        rows = []
        for user_id, neighbors in neighbors_by_user.items():
            for n in neighbors:
                rows.append({
                    "run_id": run_id,
                    "user_id": user_id,
                    "neighbor_user_id": n["neighbor_user_id"],
                    "metric": metric,
                    "raw_value": n["raw_value"],
                    "similarity_score": n["similarity_score"],
                    "rank": n["rank"],
                })

        query = """
            INSERT INTO user_knn_neighbors
                (run_id, user_id, neighbor_user_id, metric, raw_value, similarity_score, rank)
            VALUES
                (%(run_id)s, %(user_id)s, %(neighbor_user_id)s, %(metric)s,
                 %(raw_value)s, %(similarity_score)s, %(rank)s)
            ON CONFLICT (run_id, user_id, neighbor_user_id) DO NOTHING
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.executemany(query, rows)
                conn.commit()

    def get_user_neighbors(self, run_id: int, user_id: int, metric: str) -> list[dict[str, Any]]:
        query = """
            SELECT neighbor_user_id, raw_value, similarity_score, rank
            FROM user_knn_neighbors
            WHERE run_id = %(run_id)s AND user_id = %(user_id)s AND metric = %(metric)s
            ORDER BY rank ASC
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, "user_id": user_id, "metric": metric})
                return [dict(r) for r in cur.fetchall()]

    # ── graph_edges ───────────────────────────────────────────────────────────

    def save_edges(self, run_id: int, metric: str, edges: list[dict[str, Any]]) -> None:
        query = """
            INSERT INTO graph_edges
                (run_id, source_user_id, target_user_id, metric, weight,
                 similarity_score, rank, is_mutual, direction_type)
            VALUES
                (%(run_id)s, %(source_user_id)s, %(target_user_id)s, %(metric)s, %(weight)s,
                 %(similarity_score)s, %(rank)s, %(is_mutual)s, %(direction_type)s)
            ON CONFLICT (run_id, source_user_id, target_user_id) DO NOTHING
        """
        rows = [
            {
                "run_id": run_id,
                "source_user_id": e["source_user_id"],
                "target_user_id": e["target_user_id"],
                "metric": metric,
                "weight": e["weight"],
                "similarity_score": e["similarity_score"],
                "rank": e["rank"],
                "is_mutual": e["is_mutual"],
                "direction_type": e["direction_type"],
            }
            for e in edges
        ]
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.executemany(query, rows)
                conn.commit()

    def get_edges(
        self,
        run_id: int,
        metric: str,
        mutual_only: bool = True,
    ) -> list[dict[str, Any]]:
        mutual_filter = "AND is_mutual = TRUE" if mutual_only else ""
        query = f"""
            SELECT source_user_id, target_user_id, metric, weight, similarity_score, rank, is_mutual
            FROM graph_edges
            WHERE run_id = %(run_id)s AND metric = %(metric)s {mutual_filter}
            ORDER BY weight DESC
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, "metric": metric})
                return [dict(r) for r in cur.fetchall()]

    def get_edges_for_users(
        self,
        run_id: int,
        metric: str,
        user_ids: list[int],
        include_neighbor_edges: bool = False,
    ) -> list[dict[str, Any]]:
        """
        include_neighbor_edges=False: solo aristas entre el primer userId (centro) y los demás.
        include_neighbor_edges=True:  todas las aristas donde AMBOS extremos están en user_ids.
        En ambos casos ningún extremo queda fuera del conjunto de nodos.
        """
        if not user_ids:
            return []
        placeholders = ",".join(str(uid) for uid in user_ids)
        if include_neighbor_edges:
            # Subgrafo completo: ambos extremos deben estar en el conjunto
            condition = (
                f"source_user_id IN ({placeholders}) "
                f"AND target_user_id IN ({placeholders})"
            )
        else:
            # Patrón estrella: solo aristas que involucran al usuario central
            center_id = user_ids[0]
            condition = (
                f"(source_user_id = {center_id} AND target_user_id IN ({placeholders})) "
                f"OR (target_user_id = {center_id} AND source_user_id IN ({placeholders}))"
            )
        query = f"""
            SELECT source_user_id, target_user_id, metric, weight, similarity_score, rank, is_mutual
            FROM graph_edges
            WHERE run_id = %(run_id)s AND metric = %(metric)s AND ({condition})
            ORDER BY weight DESC
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, "metric": metric})
                return [dict(r) for r in cur.fetchall()]

    # ── user_graph_metrics ────────────────────────────────────────────────────

    def save_user_metrics(self, run_id: int, metrics: list[dict[str, Any]]) -> None:
        query = """
            INSERT INTO user_graph_metrics
                (run_id, user_id, metric, degree, weighted_degree,
                 betweenness, closeness, pagerank, avg_similarity, community_id)
            VALUES
                (%(run_id)s, %(user_id)s, %(metric)s, %(degree)s, %(weighted_degree)s,
                 %(betweenness)s, %(closeness)s, %(pagerank)s, %(avg_similarity)s, %(community_id)s)
            ON CONFLICT (run_id, user_id, metric) DO UPDATE SET
                degree          = EXCLUDED.degree,
                weighted_degree = EXCLUDED.weighted_degree,
                betweenness     = EXCLUDED.betweenness,
                closeness       = EXCLUDED.closeness,
                pagerank        = EXCLUDED.pagerank,
                avg_similarity  = EXCLUDED.avg_similarity,
                community_id    = EXCLUDED.community_id
        """
        rows = [{"run_id": run_id, **m} for m in metrics]
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.executemany(query, rows)
                conn.commit()

    def get_all_user_metrics(self, run_id: int, metric: str) -> list[dict[str, Any]]:
        query = """
            SELECT user_id, metric, degree, weighted_degree, betweenness,
                   closeness, pagerank, avg_similarity, community_id
            FROM user_graph_metrics
            WHERE run_id = %(run_id)s AND metric = %(metric)s
            ORDER BY user_id ASC
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, "metric": metric})
                return [dict(r) for r in cur.fetchall()]

    def get_user_metric(self, run_id: int, user_id: int, metric: str) -> dict[str, Any] | None:
        query = """
            SELECT user_id, metric, degree, weighted_degree, betweenness,
                   closeness, pagerank, avg_similarity, community_id
            FROM user_graph_metrics
            WHERE run_id = %(run_id)s AND user_id = %(user_id)s AND metric = %(metric)s
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, "user_id": user_id, "metric": metric})
                row = cur.fetchone()
                return dict(row) if row else None

    def get_user_metrics_by_ids(
        self,
        run_id: int,
        metric: str,
        user_ids: list[int],
    ) -> list[dict[str, Any]]:
        if not user_ids:
            return []
        placeholders = ",".join(str(uid) for uid in user_ids)
        query = f"""
            SELECT user_id, metric, degree, weighted_degree, betweenness,
                   closeness, pagerank, avg_similarity, community_id
            FROM user_graph_metrics
            WHERE run_id = %(run_id)s AND metric = %(metric)s
              AND user_id IN ({placeholders})
            ORDER BY user_id ASC
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, "metric": metric})
                return [dict(r) for r in cur.fetchall()]

    def get_top_users_by_centrality(
        self,
        run_id: int,
        metric: str,
        centrality: str,
        limit: int,
    ) -> list[dict[str, Any]]:
        allowed = {"degree", "weighted_degree", "betweenness", "closeness", "pagerank"}
        if centrality not in allowed:
            centrality = "pagerank"
        query = f"""
            SELECT user_id, metric, degree, weighted_degree, betweenness,
                   closeness, pagerank, avg_similarity, community_id
            FROM user_graph_metrics
            WHERE run_id = %(run_id)s AND metric = %(metric)s
            ORDER BY {centrality} DESC
            LIMIT %(limit)s
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, "metric": metric, "limit": limit})
                return [dict(r) for r in cur.fetchall()]

    # ── graph_communities ─────────────────────────────────────────────────────

    def save_communities(self, run_id: int, communities: list[dict[str, Any]]) -> None:
        query = """
            INSERT INTO graph_communities (run_id, metric, community_id, size, avg_similarity, top_genres)
            VALUES (%(run_id)s, %(metric)s, %(community_id)s, %(size)s, %(avg_similarity)s, %(top_genres)s)
            ON CONFLICT (run_id, metric, community_id) DO UPDATE SET
                size           = EXCLUDED.size,
                avg_similarity = EXCLUDED.avg_similarity,
                top_genres     = EXCLUDED.top_genres
        """
        rows = [{"run_id": run_id, **c} for c in communities]
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.executemany(query, rows)
                conn.commit()

    # ── graph_metric_summaries ────────────────────────────────────────────────

    def save_metric_summary(self, run_id: int, summary: dict[str, Any]) -> None:
        query = """
            INSERT INTO graph_metric_summaries
                (run_id, metric, nodes_count, edges_count, mutual_edges_count, density,
                 avg_weight, communities_count, avg_degree, avg_weighted_degree,
                 avg_pagerank, avg_betweenness, avg_closeness, modularity)
            VALUES
                (%(run_id)s, %(metric)s, %(nodes_count)s, %(edges_count)s, %(mutual_edges_count)s,
                 %(density)s, %(avg_weight)s, %(communities_count)s, %(avg_degree)s,
                 %(avg_weighted_degree)s, %(avg_pagerank)s, %(avg_betweenness)s,
                 %(avg_closeness)s, %(modularity)s)
            ON CONFLICT (run_id, metric) DO UPDATE SET
                nodes_count         = EXCLUDED.nodes_count,
                edges_count         = EXCLUDED.edges_count,
                mutual_edges_count  = EXCLUDED.mutual_edges_count,
                density             = EXCLUDED.density,
                avg_weight          = EXCLUDED.avg_weight,
                communities_count   = EXCLUDED.communities_count,
                avg_degree          = EXCLUDED.avg_degree,
                avg_weighted_degree = EXCLUDED.avg_weighted_degree,
                avg_pagerank        = EXCLUDED.avg_pagerank,
                avg_betweenness     = EXCLUDED.avg_betweenness,
                avg_closeness       = EXCLUDED.avg_closeness,
                modularity          = EXCLUDED.modularity
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"run_id": run_id, **summary})
                conn.commit()

    def get_all_metric_summaries(self) -> list[dict[str, Any]]:
        query = """
            SELECT
                gms.run_id, gms.metric, gms.nodes_count, gms.edges_count,
                gms.mutual_edges_count, gms.density, gms.avg_weight,
                gms.communities_count, gms.avg_degree, gms.avg_weighted_degree,
                gms.avg_pagerank, gms.avg_betweenness, gms.avg_closeness, gms.modularity
            FROM graph_metric_summaries gms
            JOIN graph_runs gr ON gr.id = gms.run_id
            WHERE gr.is_active = TRUE
            ORDER BY gms.metric ASC
        """
        with self._connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                return [dict(r) for r in cur.fetchall()]
