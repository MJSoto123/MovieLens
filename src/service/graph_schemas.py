from __future__ import annotations

from typing import Any
from pydantic import BaseModel


class CytoscapeNodeData(BaseModel):
    id: str
    label: str
    userId: int
    community: int | None
    degree: int
    weightedDegree: float
    betweenness: float
    closeness: float
    pagerank: float
    avgSimilarity: float


class CytoscapeNode(BaseModel):
    data: CytoscapeNodeData


class CytoscapeEdgeData(BaseModel):
    id: str
    source: str
    target: str
    metric: str
    weight: float
    similarityScore: float
    rank: int
    isMutual: bool


class CytoscapeEdge(BaseModel):
    data: CytoscapeEdgeData


class CytoscapeGraph(BaseModel):
    metric: str
    k: int
    run_id: int
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


class MetricSummaryItem(BaseModel):
    metric: str
    run_id: int
    nodes_count: int
    edges_count: int
    mutual_edges_count: int
    density: float
    avg_weight: float
    communities_count: int
    avg_degree: float
    avg_weighted_degree: float
    avg_pagerank: float
    avg_betweenness: float
    avg_closeness: float
    modularity: float | None


class MetricsSummaryResponse(BaseModel):
    summaries: list[MetricSummaryItem]


class CentralUserItem(BaseModel):
    user_id: int
    community_id: int | None
    degree: int
    weighted_degree: float
    betweenness: float
    closeness: float
    pagerank: float
    avg_similarity: float


class CentralUsersResponse(BaseModel):
    metric: str
    centrality: str
    run_id: int
    users: list[CentralUserItem]


class RebuildResponse(BaseModel):
    status: str
    message: str
