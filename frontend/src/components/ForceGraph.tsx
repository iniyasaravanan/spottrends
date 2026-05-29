"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3-force";
import { artistHref, polaroidRotation, accentColor } from "@/lib/utils";

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
  imageUrl: string | null;
  isCenter: boolean;
  match: number;
  rotation: number;
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

// Polaroid dimensions
const CENTER_DIM = { w: 100, h: 126, imgH: 88 };
const NODE_DIM   = { w: 72,  h: 92,  imgH: 62 };

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
    imageUrl: center.imageUrl,
    isCenter: true,
    match: 1,
    rotation: polaroidRotation(center.name),
    x: CX,
    y: CY,
    fx: CX, // stay fixed
    fy: CY,
  };

  const simNodes: SimNode[] = similar.map((s, i) => ({
    id: `sim-${i}`,
    name: s.name,
    imageUrl: s.imageUrl,
    isCenter: false,
    match: s.match,
    rotation: polaroidRotation(s.name),
    // Initial position spread evenly around center
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

// ─── SVG Polaroid node ────────────────────────────────────────────────────────

interface NodeProps {
  node: SimNode;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

function PolaroidNode({ node, onPointerDown, onClick }: NodeProps) {
  const dim = node.isCenter ? CENTER_DIM : NODE_DIM;
  const x = node.x ?? CX;
  const y = node.y ?? CY;
  const r = node.rotation;
  const color = accentColor(node.name);

  return (
    <g
      transform={`translate(${x},${y}) rotate(${r})`}
      style={{ cursor: node.isCenter ? "grab" : "pointer" }}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {/* Shadow offset */}
      <rect
        x={-dim.w / 2 + 4}
        y={-dim.h / 2 + 4}
        width={dim.w}
        height={dim.h}
        rx={3}
        fill="rgba(74,55,40,0.18)"
      />

      {/* White polaroid frame */}
      <rect
        x={-dim.w / 2}
        y={-dim.h / 2}
        width={dim.w}
        height={dim.h}
        rx={3}
        fill="white"
        stroke="rgba(74,55,40,0.12)"
        strokeWidth={1}
      />

      {/* Photo area: image or coloured placeholder */}
      {node.imageUrl ? (
        <image
          href={node.imageUrl}
          x={-dim.w / 2 + 5}
          y={-dim.h / 2 + 5}
          width={dim.w - 10}
          height={dim.imgH}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <>
          <rect
            x={-dim.w / 2 + 5}
            y={-dim.h / 2 + 5}
            width={dim.w - 10}
            height={dim.imgH}
            fill={color}
            rx={2}
          />
          <text
            x={0}
            y={-dim.h / 2 + 5 + dim.imgH / 2 + 6}
            textAnchor="middle"
            fontFamily="var(--font-caveat), cursive"
            fontSize={node.isCenter ? 18 : 14}
            fill="white"
            fontWeight="bold"
            style={{ userSelect: "none" }}
          >
            {node.name.slice(0, 2).toUpperCase()}
          </text>
        </>
      )}

      {/* Caption */}
      <text
        x={0}
        y={dim.h / 2 - 13}
        textAnchor="middle"
        fontFamily="var(--font-caveat), cursive"
        fontSize={node.isCenter ? 14 : 11}
        fill="#4A3728"
        style={{ userSelect: "none" }}
      >
        {node.name.length > (node.isCenter ? 18 : 14)
          ? node.name.slice(0, node.isCenter ? 17 : 13) + "…"
          : node.name}
      </text>

      {/* Pin on center node */}
      {node.isCenter && (
        <circle
          cx={0}
          cy={-dim.h / 2 - 9}
          r={8}
          fill="#F4B8C1"
          stroke="#D49AA8"
          strokeWidth={2}
        />
      )}

      {/* Match badge on similar nodes */}
      {!node.isCenter && node.match > 0 && (
        <text
          x={dim.w / 2 - 2}
          y={-dim.h / 2 + 14}
          textAnchor="end"
          fontFamily="var(--font-nunito), sans-serif"
          fontSize={8}
          fontWeight="700"
          fill="white"
        >
          <tspan
            dx={0}
            dy={0}
            style={{
              // Inline rect via SVG background — approximate with a rect sibling below
            }}
          />
          {Math.round(node.match * 100)}%
        </text>
      )}
      {!node.isCenter && node.match > 0 && (
        <rect
          x={dim.w / 2 - 22}
          y={-dim.h / 2 + 4}
          width={20}
          height={12}
          rx={3}
          fill="#D47878"
        />
      )}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ForceGraph({ center, similar }: Props) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);

  const [nodes, setNodes] = useState<SimNode[]>(() =>
    buildNodes(center, similar)
  );

  // Track drag state without triggering re-renders
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
        d3.forceCollide<SimNode>().radius((d) => (d.isCenter ? 68 : 48))
      )
      // Soft boundary: nudge nodes back inside the viewBox
      .on("tick", () => {
        for (const n of sim.nodes()) {
          if (n.isCenter) continue;
          const margin = 50;
          if (n.x !== undefined) n.x = Math.max(margin, Math.min(W - margin, n.x));
          if (n.y !== undefined) n.y = Math.max(margin, Math.min(H - margin, n.y));
        }
        setNodes([...sim.nodes()]);
      });

    simRef.current = sim;
    return () => sim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pointer events (drag + click) ──────────────────────────────────────────

  function handleNodePointerDown(e: React.PointerEvent, node: SimNode) {
    e.preventDefault();
    e.stopPropagation();
    if (!svgRef.current || !simRef.current) return;

    hasMoved.current = false;
    dragging.current = node;

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
    // Release non-center nodes so the sim resumes
    if (!dragging.current.isCenter) {
      dragging.current.fx = null;
      dragging.current.fy = null;
    }
    simRef.current.alphaTarget(0);
    dragging.current = null;
  }

  function handleNodeClick(e: React.MouseEvent, node: SimNode) {
    if (hasMoved.current) return; // was a drag
    e.stopPropagation();
    if (!node.isCenter) router.push(artistHref(node.name));
  }

  // ── Links between nodes ─────────────────────────────────────────────────────

  const links = buildLinks(similar);
  const resolvedLinks = links.map((link) => {
    const sourceNode = nodes.find((n) => n.id === "center");
    const targetNode = nodes.find(
      (n) => n.id === (typeof link.target === "object"
        ? (link.target as SimNode).id
        : link.target)
    );
    return { source: sourceNode, target: targetNode };
  });

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-cream-300"
      style={{ boxShadow: "inset 0 2px 8px rgba(74,55,40,0.06)" }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerLeave={handleSvgPointerUp}
      >
        <defs>
          {/* Dot pattern for corkboard background */}
          <pattern id="cork-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.2" fill="#D4B896" opacity="0.6" />
          </pattern>
        </defs>

        {/* Corkboard background */}
        <rect width={W} height={H} fill="#F5ECD7" />
        <rect width={W} height={H} fill="url(#cork-dots)" />

        {/* ── String / yarn lines ── */}
        {resolvedLinks.map((link, i) => {
          if (!link.source || !link.target) return null;
          return (
            <line
              key={i}
              x1={link.source.x ?? CX}
              y1={link.source.y ?? CY}
              x2={link.target.x ?? CX}
              y2={link.target.y ?? CY}
              stroke="#C4A882"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}

        {/* ── Nodes ── */}
        {nodes.map((node) => (
          <PolaroidNode
            key={node.id}
            node={node}
            onPointerDown={(e) => handleNodePointerDown(e, node)}
            onClick={(e) => handleNodeClick(e, node)}
          />
        ))}
      </svg>

      <p className="text-center font-hand text-sm text-brown-400 py-2 bg-cream-100 border-t border-cream-300">
        drag nodes to rearrange · click an artist to explore them ✦
      </p>
    </div>
  );
}
