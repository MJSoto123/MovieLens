"use client";

import { useEffect, useRef } from "react";
import type { GraphEdge, GraphNode } from "@/lib/api";

type CyInstance = import("cytoscape").Core;

export const COMMUNITY_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#06b6d4",
  "#a855f7", "#eab308", "#22c55e", "#3b82f6", "#e11d48",
  "#f43f5e", "#0ea5e9", "#d946ef", "#fb923c", "#4ade80",
];

export function communityColor(communityId: number | null): string {
  if (communityId === null) return "#6b7280";
  return COMMUNITY_COLORS[communityId % COMMUNITY_COLORS.length];
}

/** Devuelve el nodeId (user_X) del influencer de cada comunidad (mayor pagerank). */
function computeInfluencers(nodes: GraphNode[]): Map<number, GraphNode> {
  const best = new Map<number, GraphNode>();
  for (const n of nodes) {
    const cid = n.data.community ?? 0;
    const current = best.get(cid);
    if (!current || n.data.pagerank > current.data.pagerank) {
      best.set(cid, n);
    }
  }
  return best; // community_id → nodo influencer
}

/**
 * Pre-calcula posiciones agrupando nodos por comunidad.
 * El influencer de cada comunidad queda en el CENTRO del cluster.
 * El resto de nodos se distribuyen en un anillo alrededor.
 */
function communityPresetPositions(
  nodes: GraphNode[],
  influencersByCommunity: Map<number, GraphNode>,
  width: number,
  height: number,
): Record<string, { x: number; y: number }> {
  const byCommunity = new Map<number, GraphNode[]>();
  for (const n of nodes) {
    const cid = n.data.community ?? 0;
    if (!byCommunity.has(cid)) byCommunity.set(cid, []);
    byCommunity.get(cid)!.push(n);
  }

  const communities = Array.from(byCommunity.entries()).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  const numCommunities = communities.length;
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(cx, cy) * 0.72;
  const positions: Record<string, { x: number; y: number }> = {};

  communities.forEach(([cid, communityNodes], i) => {
    const angle = (2 * Math.PI * i) / numCommunities - Math.PI / 2;
    const commCx = cx + outerRadius * Math.cos(angle);
    const commCy = cy + outerRadius * Math.sin(angle);

    const influencer = influencersByCommunity.get(cid);
    const nonInfluencers = communityNodes.filter(
      (n) => n.data.userId !== influencer?.data.userId,
    );

    // Influencer al centro del cluster
    if (influencer) {
      positions[`user_${influencer.data.userId}`] = { x: commCx, y: commCy };
    }

    if (nonInfluencers.length === 0) return;

    const innerRadius = 18 + Math.sqrt(nonInfluencers.length) * 14;
    nonInfluencers.forEach((node, j) => {
      const nodeAngle = (2 * Math.PI * j) / nonInfluencers.length;
      positions[`user_${node.data.userId}`] = {
        x: commCx + innerRadius * Math.cos(nodeAngle),
        y: commCy + innerRadius * Math.sin(nodeAngle),
      };
    });
  });

  return positions;
}

export type LayoutMode = "community" | "force" | "concentric";

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (userId: number) => void;
  height?: number;
  showLabels?: boolean;
  layout?: LayoutMode;
  showInfluencerLegend?: boolean;
};

export function CytoscapeCanvas({
  nodes,
  edges,
  onNodeClick,
  height = 580,
  showLabels = false,
  layout = "community",
  showInfluencerLegend = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<CyInstance | null>(null);

  // Calcular influencers una vez por render (no cambian al redibujarse el layout)
  const influencersByCommunity = computeInfluencers(nodes);
  const influencerNodeIds = new Set(
    Array.from(influencersByCommunity.values()).map((n) => `user_${n.data.userId}`),
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let cy: CyInstance;

    async function init() {
      const cytoscape = (await import("cytoscape")).default;

      const pageranks = nodes.map((n) => n.data.pagerank);
      const minPr = Math.min(...pageranks);
      const maxPr = Math.max(...pageranks);
      const prSpan = maxPr - minPr || 1e-9;

      const elements = [
        ...nodes.map((n) => {
          const nodeId = `user_${n.data.userId}`;
          const isInfluencer = influencerNodeIds.has(nodeId);
          return {
            data: {
              ...n.data,
              _color: communityColor(n.data.community),
              // Influencers: tamaño fijo grande. Resto: escala por pagerank.
              _size: isInfluencer
                ? 44
                : 9 + ((n.data.pagerank - minPr) / prSpan) * 24,
              _isInfluencer: isInfluencer,
              _label: isInfluencer || showLabels ? `${n.data.userId}` : "",
            },
          };
        }),
        ...edges.map((e) => ({ data: e.data })),
      ];

      const containerWidth = containerRef.current!.offsetWidth || 900;

      let layoutConfig: object;
      if (layout === "community") {
        const positions = communityPresetPositions(
          nodes,
          influencersByCommunity,
          containerWidth,
          height,
        );
        layoutConfig = {
          name: "preset",
          positions: (node: { id: () => string }) =>
            positions[node.id()] ?? { x: containerWidth / 2, y: height / 2 },
          animate: false,
        };
      } else if (layout === "concentric") {
        layoutConfig = {
          name: "concentric",
          concentric: (node: { data: (k: string) => number }) => node.data("pagerank"),
          levelWidth: () => 0.05,
          animate: false,
          padding: 40,
        };
      } else {
        layoutConfig = {
          name: "cose",
          animate: false,
          randomize: false,
          nodeRepulsion: () => 12000,
          idealEdgeLength: () => 90,
          gravity: 0.2,
          numIter: 800,
        };
      }

      cy = cytoscape({
        container: containerRef.current!,
        elements,
        style: [
          // Nodos normales
          {
            selector: "node",
            style: {
              "background-color": "data(_color)" as never,
              width: "data(_size)" as never,
              height: "data(_size)" as never,
              label: "data(_label)" as never,
              "font-size": "8px",
              "font-weight": "normal",
              color: "#d1d5db",
              "text-valign": "bottom",
              "text-margin-y": 3,
              "overlay-padding": "4px",
              "z-index": 1,
            },
          },
          // Influencers — aspecto diferenciado
          {
            selector: "node[?_isInfluencer]",
            style: {
              "border-width": 3,
              "border-color": "#f59e0b",
              "border-style": "solid",
              "font-size": "10px",
              "font-weight": "bold",
              color: "#fbbf24",
              "text-margin-y": 5,
              "z-index": 10,
              // Halo exterior para mayor visibilidad
              "background-blacken": -0.12 as never,
            },
          },
          {
            selector: "node:selected",
            style: { "border-width": 2, "border-color": "#ffffff" },
          },
          // Aristas normales
          {
            selector: "edge",
            style: {
              width: "mapData(weight, 0, 1, 0.3, 2.5)" as never,
              "line-color": "rgba(255,255,255,0.07)",
              "curve-style": "bezier",
              opacity: 0.4,
            },
          },
          // Aristas mutuas con color de comunidad
          {
            selector: "edge[?isMutual]",
            style: {
              "line-color": "rgba(99,102,241,0.4)",
              opacity: 0.6,
            },
          },
          {
            selector: ".highlighted",
            style: { "border-width": 2.5, "border-color": "#ffffff", "z-index": 20 as never },
          },
          {
            selector: ".faded",
            style: { opacity: 0.08 },
          },
        ],
        layout: layoutConfig as never,
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false,
      });

      // Tooltip
      const tooltip = document.createElement("div");
      tooltip.style.cssText = `
        position:fixed;display:none;pointer-events:none;z-index:9999;
        background:rgba(12,12,18,0.97);border:1px solid rgba(255,255,255,0.12);
        border-radius:10px;padding:10px 14px;font-size:12px;color:#e5e7eb;
        line-height:1.65;min-width:170px;box-shadow:0 8px 32px rgba(0,0,0,0.6);
      `;
      document.body.appendChild(tooltip);

      cy.on("mouseover", "node", (evt) => {
        const d = evt.target.data();
        const color = communityColor(d.community);
        const influencerBadge = d._isInfluencer
          ? `<div style="margin-top:5px;padding:2px 8px;border-radius:99px;background:#f59e0b22;border:1px solid #f59e0b55;color:#fbbf24;font-size:11px;display:inline-block">⭐ Influencer</div>`
          : "";
        tooltip.innerHTML = `
          <div style="font-weight:600;margin-bottom:5px;display:flex;align-items:center;gap:7px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></span>
            User ${d.userId}
          </div>
          ${influencerBadge}
          <div style="color:#9ca3af;margin-top:4px">Comunidad: <span style="color:${color};font-weight:500">${d.community ?? "—"}</span></div>
          <div style="color:#9ca3af">Degree: <span style="color:#e5e7eb">${d.degree}</span></div>
          <div style="color:#9ca3af">PageRank: <span style="color:#e5e7eb">${d.pagerank.toFixed(5)}</span></div>
          <div style="color:#9ca3af">Betweenness: <span style="color:#e5e7eb">${d.betweenness.toFixed(5)}</span></div>
          <div style="color:#9ca3af">Avg sim: <span style="color:#e5e7eb">${d.avgSimilarity.toFixed(3)}</span></div>
        `;
        tooltip.style.display = "block";
      });

      cy.on("mousemove", "node", (evt) => {
        const e = evt.originalEvent as MouseEvent;
        tooltip.style.left = `${e.clientX + 15}px`;
        tooltip.style.top = `${e.clientY - 12}px`;
      });

      cy.on("mouseout", "node", () => { tooltip.style.display = "none"; });

      cy.on("tap", "node", (evt) => {
        const uid: number = evt.target.data("userId");
        cy.elements().removeClass("highlighted faded");
        evt.target.addClass("highlighted");
        evt.target.neighborhood().nodes().addClass("highlighted");
        evt.target.neighborhood().edges().addClass("highlighted");
        cy.elements().not(evt.target.closedNeighborhood()).addClass("faded");
        onNodeClick?.(uid);
      });

      cy.on("tap", (evt) => {
        if (evt.target === cy) cy.elements().removeClass("highlighted faded");
      });

      cyRef.current = cy;

      return () => { tooltip.remove(); cy.destroy(); };
    }

    let cleanup: (() => void) | undefined;
    void init().then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, showLabels, layout, height]);

  // Construir datos para la leyenda
  const legendItems = Array.from(influencersByCommunity.entries())
    .map(([cid, influencer]) => ({
      cid,
      color: communityColor(cid),
      influencerUserId: influencer.data.userId,
      pagerank: influencer.data.pagerank,
      size: nodes.filter((n) => n.data.community === cid).length,
    }))
    .sort((a, b) => b.size - a.size);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-white/8 bg-[var(--surface)] overflow-hidden">
        <div ref={containerRef} style={{ width: "100%", height }} />
      </div>

      {showInfluencerLegend && legendItems.length > 0 && (
        <InfluencerLegend items={legendItems} onUserClick={onNodeClick} />
      )}
    </div>
  );
}

// ── Leyenda de influencers por comunidad ──────────────────────────────────────

type LegendItem = {
  cid: number;
  color: string;
  influencerUserId: number;
  pagerank: number;
  size: number;
};

function InfluencerLegend({
  items,
  onUserClick,
}: {
  items: LegendItem[];
  onUserClick?: (userId: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
          Influencers por comunidad
        </span>
        <span className="rounded-full bg-[var(--bg-deep)] px-2 py-0.5 text-xs text-[var(--muted)]">
          {items.length} comunidades
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.cid}
            type="button"
            onClick={() => onUserClick?.(item.influencerUserId)}
            title={`Comunidad ${item.cid} — ${item.size} miembros — PageRank ${item.pagerank.toFixed(5)}`}
            className="flex items-center gap-2 rounded-xl border border-white/8 bg-[var(--bg-deep)] px-3 py-1.5 text-xs transition hover:border-white/20 hover:bg-white/5"
          >
            {/* Dot de comunidad */}
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {/* Estrella influencer + userId */}
            <span className="font-medium text-[#fbbf24]">⭐ {item.influencerUserId}</span>
            {/* Tamaño de comunidad */}
            <span className="text-[var(--muted)]">({item.size})</span>
          </button>
        ))}
      </div>

      <p className="mt-2 text-right text-[10px] text-[var(--muted)]">
        ⭐ = influencer (mayor PageRank) · número entre paréntesis = miembros de la comunidad · haz clic para ver vecindad
      </p>
    </div>
  );
}
