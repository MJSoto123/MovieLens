"""
Pipeline semi-offline para construir el grafo usuario-usuario KNN.

Uso:
    # Todas las métricas
    docker compose exec backend python scripts/build_user_graph.py

    # Una métrica específica
    docker compose exec backend python scripts/build_user_graph.py pearson

    # Varias métricas
    docker compose exec backend python scripts/build_user_graph.py pearson cosine
"""

from __future__ import annotations

import logging
import os
import sys

import networkx as nx

try:
    import community as community_louvain  # python-louvain
    _LOUVAIN_AVAILABLE = True
except ImportError:
    _LOUVAIN_AVAILABLE = False

from src.core.neighbors import (
    DISTANCE_METRICS,
    SIMILARITY_METRICS,
    calculate_neighbor_scores,
)
from src.data.transforms import build_ratings_by_user
from src.storage.graph_repository import GraphRepository
from src.storage.repository import PostgresRepository

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

K = 10
ALL_METRICS = ["pearson", "cosine", "euclidean", "manhattan"]
MIN_COMMON_ITEMS = 3


# ── conversión distancia → similitud ─────────────────────────────────────────

def to_similarity(raw_value: float, metric: str) -> float:
    """
    Para distancias (euclidean, manhattan): 1 / (1 + d)  → rango (0, 1].
    Para similitudes (pearson, cosine):     valor directo (ya en [-1, 1] o [0, 1]).
    """
    if metric in DISTANCE_METRICS:
        return 1.0 / (1.0 + raw_value)
    return float(raw_value)


def normalize_weights(edges: list[dict]) -> list[dict]:
    """Min-max sobre similarity_score para obtener weight ∈ [0, 1]."""
    scores = [e["similarity_score"] for e in edges]
    if not scores:
        return edges
    lo, hi = min(scores), max(scores)
    span = hi - lo if hi != lo else 1e-9
    for e in edges:
        e["weight"] = (e["similarity_score"] - lo) / span
    return edges


# ── lógica principal por métrica ──────────────────────────────────────────────

def build_graph_for_metric(
    ratings_by_user: dict,
    metric: str,
    graph_repo: GraphRepository,
    run_id: int,
    k: int = K,
) -> None:
    user_ids = list(ratings_by_user.keys())
    total = len(user_ids)

    # 1. KNN para cada usuario
    log.info(f"  [{metric}] Calculando KNN k={k} para {total} usuarios ...")
    all_neighbors: dict[int, list[dict]] = {}

    for i, uid in enumerate(user_ids):
        if i % 100 == 0:
            log.info(f"  [{metric}]   {i}/{total} usuarios procesados ...")

        raw_neighbors = calculate_neighbor_scores(
            target_user_id=uid,
            ratings_by_user=ratings_by_user,
            metric=metric,
            min_common_items=MIN_COMMON_ITEMS,
        )
        top_k = raw_neighbors[:k]
        all_neighbors[uid] = [
            {
                "neighbor_user_id": n["user_id"],
                "raw_value": float(n["score"]),
                "similarity_score": to_similarity(float(n["score"]), metric),
                "rank": rank + 1,
            }
            for rank, n in enumerate(top_k)
        ]

    # 2. Guardar vecinos KNN
    log.info(f"  [{metric}] Guardando vecinos KNN en DB ...")
    graph_repo.save_knn_neighbors(
        run_id=run_id,
        metric=metric,
        neighbors_by_user=all_neighbors,
    )

    # 3. Construir aristas con flag de mutualidad
    log.info(f"  [{metric}] Construyendo aristas ...")
    neighbor_sets: dict[int, set[int]] = {
        uid: {n["neighbor_user_id"] for n in nbrs}
        for uid, nbrs in all_neighbors.items()
    }

    edges: list[dict] = []
    for uid, nbrs in all_neighbors.items():
        for n in nbrs:
            nid = n["neighbor_user_id"]
            is_mutual = uid in neighbor_sets.get(nid, set())
            edges.append({
                "source_user_id": uid,
                "target_user_id": nid,
                "similarity_score": n["similarity_score"],
                "weight": n["similarity_score"],   # se sobreescribe en normalize
                "rank": n["rank"],
                "is_mutual": is_mutual,
                "direction_type": "undirected" if is_mutual else "directed",
            })

    edges = normalize_weights(edges)
    log.info(f"  [{metric}] Guardando {len(edges)} aristas en DB ...")
    graph_repo.save_edges(run_id=run_id, metric=metric, edges=edges)

    # 4. Grafo NetworkX (solo aristas mutuas para centralidades)
    log.info(f"  [{metric}] Calculando centralidades ...")
    G = nx.Graph()
    G.add_nodes_from(user_ids)
    for e in edges:
        if e["is_mutual"]:
            G.add_edge(e["source_user_id"], e["target_user_id"], weight=e["weight"])

    degree_map = dict(G.degree())
    weighted_degree_map = dict(G.degree(weight="weight"))
    betweenness_map = nx.betweenness_centrality(G, weight="weight", normalized=True)
    closeness_map = nx.closeness_centrality(G)
    pagerank_map = nx.pagerank(G, weight="weight")

    # 5. Detección de comunidades
    log.info(f"  [{metric}] Detectando comunidades ...")
    communities: dict[int, int] = {}
    modularity: float | None = None

    if _LOUVAIN_AVAILABLE:
        partition = community_louvain.best_partition(G, weight="weight")
        communities = partition
        modularity = community_louvain.modularity(partition, G, weight="weight")
        n_communities = len(set(partition.values()))
        log.info(f"  [{metric}] {n_communities} comunidades (Louvain), modularidad={modularity:.4f}")
    else:
        # Fallback: componentes conectados
        for comp_id, component in enumerate(nx.connected_components(G)):
            for uid in component:
                communities[uid] = comp_id
        n_communities = len(set(communities.values()))
        log.info(f"  [{metric}] {n_communities} comunidades (componentes conectados, Louvain no disponible)")

    # avg_similarity por usuario (sobre sus vecinos KNN)
    avg_sim: dict[int, float] = {}
    for uid, nbrs in all_neighbors.items():
        sims = [n["similarity_score"] for n in nbrs]
        avg_sim[uid] = sum(sims) / len(sims) if sims else 0.0

    # 6. Guardar métricas de usuarios
    log.info(f"  [{metric}] Guardando métricas de {total} usuarios ...")
    user_metrics = [
        {
            "user_id": uid,
            "metric": metric,
            "degree": int(degree_map.get(uid, 0)),
            "weighted_degree": float(weighted_degree_map.get(uid, 0.0)),
            "betweenness": float(betweenness_map.get(uid, 0.0)),
            "closeness": float(closeness_map.get(uid, 0.0)),
            "pagerank": float(pagerank_map.get(uid, 0.0)),
            "avg_similarity": float(avg_sim.get(uid, 0.0)),
            "community_id": communities.get(uid),
        }
        for uid in user_ids
    ]
    graph_repo.save_user_metrics(run_id=run_id, metrics=user_metrics)

    # 7. Guardar comunidades
    community_sizes: dict[int, int] = {}
    for cid in communities.values():
        community_sizes[cid] = community_sizes.get(cid, 0) + 1

    community_rows = [
        {
            "metric": metric,
            "community_id": cid,
            "size": size,
            "avg_similarity": None,
            "top_genres": None,
        }
        for cid, size in community_sizes.items()
    ]
    graph_repo.save_communities(run_id=run_id, communities=community_rows)

    # 8. Guardar summary global
    mutual_count = sum(1 for e in edges if e["is_mutual"])
    all_weights = [e["weight"] for e in edges]

    summary = {
        "metric": metric,
        "nodes_count": total,
        "edges_count": len(edges),
        "mutual_edges_count": mutual_count,
        "density": float(nx.density(G)),
        "avg_weight": float(sum(all_weights) / len(all_weights)) if all_weights else 0.0,
        "communities_count": len(community_sizes),
        "avg_degree": float(sum(degree_map.values()) / total) if total else 0.0,
        "avg_weighted_degree": float(sum(weighted_degree_map.values()) / total) if total else 0.0,
        "avg_pagerank": float(sum(pagerank_map.values()) / total) if total else 0.0,
        "avg_betweenness": float(sum(betweenness_map.values()) / total) if total else 0.0,
        "avg_closeness": float(sum(closeness_map.values()) / total) if total else 0.0,
        "modularity": modularity,
    }
    graph_repo.save_metric_summary(run_id=run_id, summary=summary)
    log.info(
        f"  [{metric}] Listo — {total} nodos, {len(edges)} aristas "
        f"({mutual_count} mutuas), {len(community_sizes)} comunidades."
    )


# ── entrypoint ────────────────────────────────────────────────────────────────

def main(metrics: list[str] | None = None) -> None:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        log.error("DATABASE_URL no está configurada.")
        sys.exit(1)

    target_metrics = metrics or ALL_METRICS

    invalid = [m for m in target_metrics if m not in ALL_METRICS]
    if invalid:
        log.error(f"Métricas no válidas: {invalid}. Opciones: {ALL_METRICS}")
        sys.exit(1)

    repo = PostgresRepository(database_url)
    graph_repo = GraphRepository(database_url)

    log.info("Inicializando esquema de grafo ...")
    graph_repo.bootstrap_graph_schema()

    ratings = repo.fetch_active_ratings()
    ratings_by_user = build_ratings_by_user(ratings)
    log.info(f"Usuarios activos: {len(ratings_by_user)}")

    if not ratings_by_user:
        log.error("No hay usuarios activos con ratings. Ejecuta el seed primero.")
        sys.exit(1)

    for metric in target_metrics:
        log.info(f"=== Iniciando métrica: {metric} ===")
        run_id = graph_repo.create_run(
            metric=metric,
            k=K,
            total_users=len(ratings_by_user),
        )

        try:
            graph_repo.update_run_status(run_id=run_id, status="running")
            build_graph_for_metric(
                ratings_by_user=ratings_by_user,
                metric=metric,
                graph_repo=graph_repo,
                run_id=run_id,
                k=K,
            )
            edge_count = graph_repo.count_edges(run_id=run_id)
            graph_repo.update_run_status(
                run_id=run_id,
                status="completed",
                total_edges=edge_count,
            )
            graph_repo.set_active_run(metric=metric, run_id=run_id)
            log.info(f"=== {metric}: run {run_id} completado ({edge_count} aristas). ===")
        except Exception as exc:
            graph_repo.update_run_status(run_id=run_id, status="failed", notes=str(exc))
            log.error(f"Error en métrica {metric}: {exc}", exc_info=True)
            raise

    log.info("Pipeline completo.")


if __name__ == "__main__":
    requested = sys.argv[1:] if len(sys.argv) > 1 else None
    main(metrics=requested)
