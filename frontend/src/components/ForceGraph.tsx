"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3-force";
import { artistHref, accentColor, initials } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GraphArtist {
  name: string;
  imageUrl: string | null;
  match: number; // 0–1
}

interface Props {
  center: { name: string; imageUrl: string | null };
  similar: GraphArtist[];
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  isCenter: boolean;
  match: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  distance: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const W = 800;
const H = 520;
const CX = W / 2;
const CY = H / 2;

const CENTER_R = 50;
const NODE_R   = 32;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSvgPoint(
  e: React.PointerEvent | PointerEvent,
  svgEl: SVGSVGElement
) {
  const rect = svgEl.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width)  * W,
    y: ((e.clientY - rect.top)  / rect.height) * H,
  };
}

function buildNodes(center: Props["center"], similar: GraphArtist[]): SimNode[] {
  const centerNode: SimNode = {
    id: "center",
    name: center.name,
    isCenter: true,
    match: 1,
    x: CX, y: CY, fx: CX, fy: CY,
  };

  const simNodes: SimNode[] = similar.map((s, i) => ({
    id: `sim-${i}`,
    name: s.name,
    isCenter: false,
    match: s.match,
    x: CX + Math.cos((i / similar.length) * 2 * Math.PI) * 200,
    y: CY + Math.sin((i / similar.length) * 2 * Math.PI) * 200,
  }));

  return [centerNode, ...simNodes];
}

function buildLinks(similar: GraphArtist[]): SimLink[] {
  return similar.map((s, i) => ({
    id: `link-${i}`,
    source: "center",
    target: `sim-${i}`,
    // Higher match → shorter distance (closer to center)
    distance: (1 - s.match) * 200 + 110,
  }));
}

// ─── Circle node ─────────────────────────────────────────────────────────────

interface NodeProps {
  node: SimNode;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

function CircleNode({ node, onPointerDown, onClick }: NodeProps) {
  const x     = node.x ?? CX;
  const y     = node.y ?? CY;
  const r     = node.isCenter ? CENTER_R : NODE_R;
  const color = accentColor(node.name);
  const label = initials(node.name);

  const maxLen     = node.isCenter ? 16 : 12;
  const displayName =
    node.name.length > maxLen ? node.name.slice(0, maxLen - 1) + "…" : node.name;

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: node.isCenter ? "default" : "pointer" }}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {/* Soft shadow */}
      <circle r={r} fill="rgba(26,43,94,0.10)" transform="translate(2,3)" />

      {/* Main circle */}
      <circle r={r} fill={color} />

      {/* Initials */}
      <text
        textAnchor="middle"
        dy="0.38em"
        fill="white"
        fontFamily="var(--font-syne), sans-serif"
        fontSize={node.isCenter ? 20 : 13}
        fontWeight="700"
        style={{ userSelect: "none" }}
      >
        {label}
      </text>

      {/* Name label below */}
      <text
        y={r + 16}
        textAnchor="middle"
        fill="#1A2B5E"
        fontFamily="var(--font-dm-sans), sans-serif"
        fontSize={node.isCenter ? 12 : 10}
        fontWeight={node.isCenter ? "600" : "500"}
        style={{ userSelect: "none" }}
      >
        {displayName}
      </text>

      {/* Match percentage above similar nodes */}
      {!node.isCenter && (
        <text
          y={-r - 7}
          textAnchor="middle"
          fill={color}
          fontFamily="var(--font-dm-sans), sans-serif"
          fontSize={9}
          fontWeight="600"
          style={{ userSelect: "none" }}
        >
          {Math.round(node.match * 100)}%
        </text>
      )}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ForceGraph({ center, similar }: Props) {
  const router  = useRouter();
  const svgRef  = useRef<SVGSVGElement>(null);
  const simRef  = useRef<d3.Simulation<SimNode, SimLink> | null>(null);

  const [nodes, setNodes] = useState<SimNode[]>(() =>
    buildNodes(center, similar)
  );

  // Drag state — refs avoid re-renders
  const dragging = useRef<SimNode | null>(null);
  const hasMoved  = useRef(false);

  useEffect(() => {
    const initNodes = buildNodes(center, similar);
    const initLinks = buildLinks(similar);

    const sim = d3
      .forceSimulation<SimNode, SimLink>(initNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(initLinks)
          .id((d) => d.id)
          .distance((d) => (d as SimLink).distance)
          .strength(0.7)
      )
      .force("charge", d3.forceManyBody<SimNode>().strength(-180))
      .force(
        "collide",
        d3.forceCollide<SimNode>().radius((d) =>
          d.isCenter ? CENTER_R + 20 : NODE_R + 16
        )
      )
      .on("tick", () => {
        for (const n of sim.nodes()) {
          if (n.isCenter) continue;
          const margin = 60;
          if (n.x !== undefined) n.x = Math.max(margin, Math.min(W - margin, n.x));
          if (n.y !== undefined) n.y = Math.max(margin, Math.min(H - margin, n.y));
        }
        setNodes([...sim.nodes()]);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pointer events (drag + click distinction) ──────────────────────────────

  function handleNodePointerDown(e: React.PointerEvent, node: SimNode) {
    e.preventDefault();
    e.stopPropagation();
    if (!svgRef.current || !simRef.current) return;

    hasMoved.current  = false;
    dragging.current  = node;
    node.fx = node.x;
    node.fy = node.y;
    simRef.current.alphaTarget(0.3).restart();
  }

  function handleSvgPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !svgRef.current) return;
    const { x, y } = getSvgPoint(e, svgRef.current);

    const dx = Math.abs(x - (dragging.current.fx ?? x));
    const dy = Math.abs(y - (dragging.current.fy ?? y));
    if (dx > 4 || dy > 4) hasMoved.current = true;

    dragging.current.fx = x;
    dragging.current.fy = y;
  }

  function handleSvgPointerUp() {
    if (!dragging.current || !simRef.current) return;
    // Release similar nodes so physics resumes
    if (!dragging.current.isCenter) {
      dragging.current.fx = null;
      dragging.current.fy = null;
    }
    simRef.current.alphaTarget(0);
    dragging.current = null;
  }

  function handleNodeClick(e: React.MouseEvent, node: SimNode) {
    if (hasMoved.current) return; // was a drag, not a click
    e.stopPropagation();
    if (!node.isCenter) router.push(artistHref(node.name));
  }

  // ── Resolve link endpoints for rendering ───────────────────────────────────

  const links = buildLinks(similar);
  const resolvedLinks = links.map((link) => {
    const sourceNode = nodes.find((n) => n.id === "center");
    const targetNode = nodes.find(
      (n) =>
        n.id ===
        (typeof link.target === "object"
          ? (link.target as SimNode).id
          : link.target)
    );
    return { source: sourceNode, target: targetNode };
  });

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-ivory-200 shadow-inner">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          touchAction: "none",
        }}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerLeave={handleSvgPointerUp}
      >
        {/* Background */}
        <rect width={W} height={H} fill="#FAF4EE" />

        {/* Concentric guide rings — suggest distance from centre */}
        {[120, 200, 290].map((r) => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke="#1A2B5E"
            strokeWidth={1}
            opacity={0.07}
            strokeDasharray="5 9"
          />
        ))}

        {/* ── Link lines ── */}
        {resolvedLinks.map((link, i) => {
          if (!link.source || !link.target) return null;
          return (
            <line
              key={i}
              x1={link.source.x ?? CX}
              y1={link.source.y ?? CY}
              x2={link.target.x ?? CX}
              y2={link.target.y ?? CY}
              stroke="#1A2B5E"
              strokeWidth={1}
              opacity={0.14}
            />
          );
        })}

        {/* ── Circle nodes ── */}
        {nodes.map((node) => (
          <CircleNode
            key={node.id}
            node={node}
            onPointerDown={(e) => handleNodePointerDown(e, node)}
            onClick={(e) => handleNodeClick(e, node)}
          />
        ))}
      </svg>

      <p className="text-center font-sans text-xs text-navy-muted py-2.5 bg-white border-t border-ivory-200">
        drag to rearrange · click an artist to explore
      </p>
    </div>
  );
}
