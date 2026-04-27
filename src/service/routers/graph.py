from __future__ import annotations

import io
import os
import subprocess
import sys
import zipfile
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from src.service.graph_schemas import (
    CentralUsersResponse,
    CytoscapeGraph,
    MetricsSummaryResponse,
    RebuildResponse,
)
from src.storage.graph_repository import GraphRepository

router = APIRouter(prefix="/graph", tags=["graph"])

_VALID_METRICS = {"pearson", "cosine", "euclidean", "manhattan"}
_VALID_CENTRALITIES = {"degree", "weighted_degree", "betweenness", "closeness", "pagerank"}


def _repo() -> GraphRepository:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL no configurada.")
    repo = GraphRepository(database_url)
    repo.bootstrap_graph_schema()
    return repo


def _active_run(repo: GraphRepository, metric: str) -> dict[str, Any]:
    run = repo.get_active_run(metric=metric)
    if run is None:
        raise HTTPException(
            status_code=404,
            detail=f"No hay grafo calculado para '{metric}'. Ejecuta: "
                   f"docker compose exec backend python scripts/build_user_graph.py {metric}",
        )
    return run


# ── helpers Cytoscape ─────────────────────────────────────────────────────────

def _to_cytoscape(run: dict, nodes: list[dict], edges: list[dict], metric: str) -> CytoscapeGraph:
    cy_nodes = [
        {
            "data": {
                "id": f"user_{n['user_id']}",
                "label": f"User {n['user_id']}",
                "userId": n["user_id"],
                "community": n.get("community_id"),
                "degree": n.get("degree", 0),
                "weightedDegree": round(float(n.get("weighted_degree", 0.0)), 4),
                "betweenness": round(float(n.get("betweenness", 0.0)), 6),
                "closeness": round(float(n.get("closeness", 0.0)), 6),
                "pagerank": round(float(n.get("pagerank", 0.0)), 6),
                "avgSimilarity": round(float(n.get("avg_similarity", 0.0)), 4),
            }
        }
        for n in nodes
    ]
    cy_edges = [
        {
            "data": {
                "id": f"edge_{e['source_user_id']}_{e['target_user_id']}_{metric}",
                "source": f"user_{e['source_user_id']}",
                "target": f"user_{e['target_user_id']}",
                "metric": metric,
                "weight": round(float(e.get("weight", 0.0)), 4),
                "similarityScore": round(float(e.get("similarity_score", 0.0)), 4),
                "rank": e.get("rank", 0),
                "isMutual": bool(e.get("is_mutual", False)),
            }
        }
        for e in edges
    ]
    return CytoscapeGraph(
        metric=metric,
        k=int(run.get("k", 10)),
        run_id=int(run["id"]),
        nodes=cy_nodes,
        edges=cy_edges,
    )


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("/knn", response_model=CytoscapeGraph)
def get_knn_graph(
    metric: str = Query(default="pearson"),
    mutual_only: bool = Query(default=True),
) -> CytoscapeGraph:
    """Grafo KNN completo en formato Cytoscape.js."""
    if metric not in _VALID_METRICS:
        raise HTTPException(status_code=422, detail=f"Métrica inválida. Opciones: {sorted(_VALID_METRICS)}")
    repo = _repo()
    run = _active_run(repo, metric)
    nodes = repo.get_all_user_metrics(run_id=run["id"], metric=metric)
    edges = repo.get_edges(run_id=run["id"], metric=metric, mutual_only=mutual_only)
    return _to_cytoscape(run=run, nodes=nodes, edges=edges, metric=metric)


@router.get("/metrics-summary", response_model=MetricsSummaryResponse)
def get_metrics_summary() -> MetricsSummaryResponse:
    """Estadísticas comparativas de todos los runs activos."""
    repo = _repo()
    summaries = repo.get_all_metric_summaries()
    return MetricsSummaryResponse(summaries=summaries)


@router.get("/users/{user_id}/neighborhood", response_model=CytoscapeGraph)
def get_user_neighborhood(
    user_id: int,
    metric: str = Query(default="pearson"),
    include_neighbor_edges: bool = Query(default=False),
) -> CytoscapeGraph:
    """Ego network: usuario central + sus k vecinos."""
    if metric not in _VALID_METRICS:
        raise HTTPException(status_code=422, detail=f"Métrica inválida. Opciones: {sorted(_VALID_METRICS)}")
    repo = _repo()
    run = _active_run(repo, metric)

    center = repo.get_user_metric(run_id=run["id"], user_id=user_id, metric=metric)
    if center is None:
        raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado en el grafo de '{metric}'.")

    knn_neighbors = repo.get_user_neighbors(run_id=run["id"], user_id=user_id, metric=metric)
    neighbor_ids = [n["neighbor_user_id"] for n in knn_neighbors]
    all_ids = [user_id] + neighbor_ids

    nodes = repo.get_user_metrics_by_ids(run_id=run["id"], metric=metric, user_ids=all_ids)
    edges = repo.get_edges_for_users(
        run_id=run["id"],
        metric=metric,
        user_ids=all_ids,
        include_neighbor_edges=include_neighbor_edges,
    )
    return _to_cytoscape(run=run, nodes=nodes, edges=edges, metric=metric)


@router.get("/central-users", response_model=CentralUsersResponse)
def get_central_users(
    metric: str = Query(default="pearson"),
    centrality: str = Query(default="pagerank"),
    limit: int = Query(default=20, ge=1, le=100),
) -> CentralUsersResponse:
    """Ranking de usuarios ordenado por centralidad."""
    if metric not in _VALID_METRICS:
        raise HTTPException(status_code=422, detail=f"Métrica inválida. Opciones: {sorted(_VALID_METRICS)}")
    if centrality not in _VALID_CENTRALITIES:
        raise HTTPException(status_code=422, detail=f"Centralidad inválida. Opciones: {sorted(_VALID_CENTRALITIES)}")
    repo = _repo()
    run = _active_run(repo, metric)
    users = repo.get_top_users_by_centrality(
        run_id=run["id"],
        metric=metric,
        centrality=centrality,
        limit=limit,
    )
    return CentralUsersResponse(
        metric=metric,
        centrality=centrality,
        run_id=int(run["id"]),
        users=users,
    )


@router.post("/rebuild", response_model=RebuildResponse)
def rebuild_graph(
    metric: str | None = Query(default=None),
) -> RebuildResponse:
    """
    Ejecuta el pipeline semi-offline.
    Para 600 usuarios tarda ~30-60 seg por métrica.
    """
    if metric is not None and metric not in _VALID_METRICS:
        raise HTTPException(status_code=422, detail=f"Métrica inválida. Opciones: {sorted(_VALID_METRICS)}")

    cmd = [sys.executable, "scripts/build_user_graph.py"]
    if metric:
        cmd.append(metric)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Error en rebuild: {(result.stderr or result.stdout)[-800:]}",
            )
        last_lines = "\n".join((result.stdout or "").strip().splitlines()[-10:])
        return RebuildResponse(status="completed", message=last_lines)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Rebuild excedió el timeout de 600 segundos.")


@router.get("/export/gephi")
def export_gephi(
    metric: str = Query(default="pearson"),
    mutual_only: bool = Query(default=True),
) -> StreamingResponse:
    """Descarga un ZIP con nodes.csv y edges.csv listos para Gephi."""
    if metric not in _VALID_METRICS:
        raise HTTPException(status_code=422, detail=f"Métrica inválida. Opciones: {sorted(_VALID_METRICS)}")
    repo = _repo()
    run = _active_run(repo, metric)

    nodes = repo.get_all_user_metrics(run_id=run["id"], metric=metric)
    edges = repo.get_edges(run_id=run["id"], metric=metric, mutual_only=mutual_only)

    nodes_csv = _build_nodes_csv(nodes, metric)
    edges_csv = _build_edges_csv(edges, mutual_only=mutual_only)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"nodes_{metric}.csv", nodes_csv)
        zf.writestr(f"edges_{metric}.csv", edges_csv)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=gephi_{metric}.zip"},
    )


# ── CSV builders ──────────────────────────────────────────────────────────────

def _build_nodes_csv(nodes: list[dict], metric: str) -> str:
    lines = ["Id,Label,metric,community,degree,weightedDegree,betweenness,closeness,pagerank,avgSimilarity"]
    for n in nodes:
        lines.append(
            f"{n['user_id']},"
            f"User {n['user_id']},"
            f"{metric},"
            f"{n.get('community_id', '')},"
            f"{n.get('degree', 0)},"
            f"{float(n.get('weighted_degree', 0.0)):.6f},"
            f"{float(n.get('betweenness', 0.0)):.6f},"
            f"{float(n.get('closeness', 0.0)):.6f},"
            f"{float(n.get('pagerank', 0.0)):.6f},"
            f"{float(n.get('avg_similarity', 0.0)):.6f}"
        )
    return "\n".join(lines)


def _build_edges_csv(edges: list[dict], mutual_only: bool) -> str:
    edge_type = "Undirected" if mutual_only else "Directed"
    lines = ["Source,Target,Type,Weight,metric,rank,similarityScore,isMutual"]
    for e in edges:
        lines.append(
            f"{e['source_user_id']},"
            f"{e['target_user_id']},"
            f"{edge_type},"
            f"{float(e.get('weight', 0.0)):.6f},"
            f"{e.get('metric', '')},"
            f"{e.get('rank', 0)},"
            f"{float(e.get('similarity_score', 0.0)):.6f},"
            f"{e.get('is_mutual', False)}"
        )
    return "\n".join(lines)
