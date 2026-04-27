-- ============================================================
-- Módulo: User-User KNN Graph
-- Depende de: users (tabla existente)
-- ============================================================

CREATE TABLE IF NOT EXISTS graph_runs (
    id          BIGSERIAL PRIMARY KEY,
    metric      TEXT NOT NULL CHECK (metric IN ('pearson', 'cosine', 'euclidean', 'manhattan')),
    k           INTEGER NOT NULL DEFAULT 10,
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    total_users INTEGER,
    total_edges INTEGER,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Solo un run activo por métrica
CREATE UNIQUE INDEX IF NOT EXISTS idx_graph_runs_active_metric
    ON graph_runs (metric)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_graph_runs_metric_status
    ON graph_runs (metric, status);


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
);

CREATE INDEX IF NOT EXISTS idx_knn_run_user
    ON user_knn_neighbors (run_id, user_id);

CREATE INDEX IF NOT EXISTS idx_knn_run_metric
    ON user_knn_neighbors (run_id, metric);


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
                     CHECK (direction_type IN ('directed', 'undirected')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (run_id, source_user_id, target_user_id)
);

CREATE INDEX IF NOT EXISTS idx_edges_run_source
    ON graph_edges (run_id, source_user_id);

CREATE INDEX IF NOT EXISTS idx_edges_run_target
    ON graph_edges (run_id, target_user_id);

CREATE INDEX IF NOT EXISTS idx_edges_run_mutual
    ON graph_edges (run_id, is_mutual);

CREATE INDEX IF NOT EXISTS idx_edges_run_metric
    ON graph_edges (run_id, metric);


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
);

CREATE INDEX IF NOT EXISTS idx_ugm_run_metric
    ON user_graph_metrics (run_id, metric);

CREATE INDEX IF NOT EXISTS idx_ugm_run_community
    ON user_graph_metrics (run_id, community_id);

CREATE INDEX IF NOT EXISTS idx_ugm_pagerank
    ON user_graph_metrics (run_id, metric, pagerank DESC);


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
);

CREATE INDEX IF NOT EXISTS idx_communities_run_metric
    ON graph_communities (run_id, metric);


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
);
