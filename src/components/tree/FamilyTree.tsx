"use client";

import Link from "next/link";


import { useEffect, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import MemberNode from "./MemberNode";
import MemberProfileModal from "../members/MemberProfileModal";
import { IMember } from "@/models/Member";

const nodeTypes = { memberNode: MemberNode };

// ── Layout engine ────────────────────────────────────────────────────────────
// Custom generational layout:
//  1. Group members by generation level (BFS from roots)
//  2. Place spouses side-by-side
//  3. Centre children beneath their parents

const NODE_W = 160;
const NODE_H = 88;
const H_GAP = 40;   // horizontal gap between siblings / spouses
const V_GAP = 120;  // vertical gap between generations

interface MemberMap { [id: string]: IMember }

function buildLayout(members: IMember[]): { nodes: Node[]; edges: Edge[] } {
  if (members.length === 0) return { nodes: [], edges: [] };

  const byId: MemberMap = {};
  members.forEach((m) => { byId[m._id] = m; });

  // Build children map
  const childrenOf: Record<string, string[]> = {};
  members.forEach((m) => {
    if (m.parentId) {
      const pid = m.parentId.toString();
      if (!childrenOf[pid]) childrenOf[pid] = [];
      childrenOf[pid].push(m._id);
    }
  });

  // BFS to assign generation levels (only via parent links)
  const level: Record<string, number> = {};
  const roots = members.filter((m) => !m.parentId);
  const queue: string[] = roots.map((r) => r._id);
  roots.forEach((r) => { level[r._id] = 0; });
  while (queue.length) {
    const id = queue.shift()!;
    (childrenOf[id] || []).forEach((cid) => {
      if (level[cid] === undefined) {
        level[cid] = level[id] + 1;
        queue.push(cid);
      }
    });
  }
  // Assign remaining (disconnected) members
  members.forEach((m) => { if (level[m._id] === undefined) level[m._id] = 0; });

  // Group by level
  const byLevel: Record<number, string[]> = {};
  members.forEach((m) => {
    const l = level[m._id];
    if (!byLevel[l]) byLevel[l] = [];
    byLevel[l].push(m._id);
  });

  const pos: Record<string, { x: number; y: number }> = {};

  // Assign x positions level by level, placing spouses adjacent
  const maxLevel = Math.max(...Object.keys(byLevel).map(Number));
  for (let l = 0; l <= maxLevel; l++) {
    const ids = byLevel[l] || [];
    // Deduplicate: spouses on the same level appear once as a pair
    const placed = new Set<string>();
    const orderedPairs: [string, string | null][] = [];
    ids.forEach((id) => {
      if (placed.has(id)) return;
      const m = byId[id];
      const spId = m.spouseId?.toString();
      if (spId && byId[spId] && level[spId] === l && !placed.has(spId)) {
        orderedPairs.push([id, spId]);
        placed.add(id);
        placed.add(spId);
      } else {
        orderedPairs.push([id, null]);
        placed.add(id);
      }
    });

    const totalW = orderedPairs.reduce(
      (acc, [, sp]) => acc + (sp ? NODE_W * 2 + H_GAP : NODE_W),
      0
    ) + H_GAP * (orderedPairs.length - 1);

    let curX = -totalW / 2;
    const y = l * (NODE_H + V_GAP);

    orderedPairs.forEach(([id, spId]) => {
      pos[id] = { x: curX, y };
      curX += NODE_W + H_GAP / 2;
      if (spId) {
        pos[spId] = { x: curX, y };
        curX += NODE_W + H_GAP;
      } else {
        curX += H_GAP / 2;
      }
    });
  }

  // Build React Flow nodes
  const nodes: Node[] = members.map((m) => ({
    id: m._id,
    type: "memberNode",
    position: pos[m._id] ?? { x: 0, y: 0 },
    data: {
      label: m.name,
      gender: m.gender,
      birthDate: m.birthDate,
      deathDate: m.deathDate,
    },
  }));

  // Build edges
  const edges: Edge[] = [];
  const spouseEdgeSeen = new Set<string>();

  members.forEach((m) => {
    // Parent → child
    if (m.parentId) {
      edges.push({
        id: `e-pc-${m.parentId}-${m._id}`,
        source: m.parentId.toString(),
        target: m._id,
        type: "smoothstep",
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      });
    }

    // Spouse ↔ spouse (horizontal, straight)
    if (m.spouseId) {
      const key = [m._id, m.spouseId.toString()].sort().join("-");
      if (!spouseEdgeSeen.has(key)) {
        spouseEdgeSeen.add(key);
        edges.push({
          id: `e-sp-${key}`,
          source: m._id,
          target: m.spouseId.toString(),
          type: "straight",
          style: { stroke: "#f9a8d4", strokeWidth: 2, strokeDasharray: "6 3" },
        });
      }
    }
  });

  return { nodes, edges };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function FamilyTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("Không thể tải dữ liệu");
        const members: IMember[] = await res.json();

        const { nodes: n, edges: e } = buildLayout(members);

        // Inject onClick after layout
        const withClick = n.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onClick: () => setSelectedMemberId(node.id),
          },
        }));

        setNodes(withClick);
        setEdges(e);
      } catch (err) {
        console.error(err);
        setError("Không tải được dữ liệu gia phả. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    })();
  }, [setNodes, setEdges]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-stone-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <p className="text-stone-500">Đang tải gia phả…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-stone-50">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#f5f0eb]">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <span className="text-xl font-bold text-amber-800">🌳 Cây Gia Phả</span>
        <span className="text-stone-400 text-sm">• Click vào thành viên để xem chi tiết</span>
        <Link
          href="/"
          className="ml-auto text-sm text-stone-500 hover:text-amber-700 transition-colors"
        >
          ← Trang chủ
        </Link>
      </div>

      {/* Legend */}
      <div className="absolute bottom-12 left-4 z-10 flex flex-col gap-1.5 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-stone-100 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-0.5 bg-stone-400" />
          Quan hệ cha / mẹ - con
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 border-t-2 border-dashed border-pink-300" />
          Quan hệ vợ / chồng
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-200 border-2 border-blue-400 inline-block" />
          Nam
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink-200 border-2 border-pink-400 inline-block" />
          Nữ
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.8}
        attributionPosition="bottom-right"
        className="pt-14"
      >
        <Controls className="!bottom-4 !left-4" />
        <MiniMap
          className="!bottom-4 !right-4 !w-32 !h-24 rounded-xl opacity-80"
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d6cdc5" />
      </ReactFlow>

      {selectedMemberId && (
        <MemberProfileModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
}
