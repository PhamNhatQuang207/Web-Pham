"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Background,
  Controls,
  MiniMap,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

import { IMember } from "@/models/Member";
import FamilyNode from "./FamilyNode";
import MemberProfileModal from "../members/MemberProfileModal";
import Link from "next/link";

const nodeTypes = {
  family: FamilyNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const NODE_WIDTH = 400; // Rough width of a family node
const NODE_HEIGHT = 150;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function FamilyTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false); // Mobile: hidden by default

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/members");
        const members: IMember[] = await response.json();

        // 1. Group by "Family Unit" (A father and his wives)
        const families: Record<string, { primary: IMember; spouses: IMember[] }> = {};
        const byId: Record<string, IMember> = {};
        members.forEach((m) => (byId[m._id] = m));

        members.forEach((m) => {
          if (m.gender === "male") {
            families[m._id] = { primary: m, spouses: [] };
            if (m.spouseIds) {
              m.spouseIds.forEach((spId) => {
                const spouse = byId[spId.toString()];
                if (spouse) families[m._id].spouses.push(spouse);
              });
            }
          }
        });

        // 2. Create Nodes
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];

        Object.values(families).forEach((fam) => {
          initialNodes.push({
            id: fam.primary._id,
            type: "family",
            data: {
              primary: fam.primary,
              spouses: fam.spouses,
              onMemberClick: (id: string) => setSelectedId(id),
            },
            position: { x: 0, y: 0 },
          });

          if (fam.primary.fatherId) {
            initialEdges.push({
              id: `e-${fam.primary.fatherId}-${fam.primary._id}`,
              source: fam.primary.fatherId.toString(),
              target: fam.primary._id,
              style: { stroke: "#94a3b8", strokeWidth: 2 },
            });
          }
        });

        members.forEach((m) => {
          if (m.gender === "female" && !m.spouseIds?.length && !m.fatherId) return;
          if (!families[m._id]) {
            if (m.fatherId) {
              const fatherId = m.fatherId.toString();
              initialNodes.push({
                id: m._id,
                data: {
                  label: m.name,
                  primary: m,
                  spouses: [],
                  onMemberClick: (id: string) => setSelectedId(id),
                },
                type: "family",
                position: { x: 0, y: 0 },
              });

              initialEdges.push({
                id: `e-${fatherId}-${m._id}`,
                source: fatherId,
                target: m._id,
                style: { stroke: "#94a3b8", strokeWidth: 2 },
              });
            }
          }
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          initialNodes,
          initialEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (error) {
        console.error("Failed to load family tree:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setNodes, setEdges]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-stone-500 font-medium animate-pulse">Đang xây dựng cây gia phả...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#f5f0eb]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.05}
        maxZoom={1.5}
      >
        <Background color="#d6cdc5" gap={20} size={1} />
        <Controls showInteractive={false} position="bottom-right" />
        <div className="hidden sm:block">
          <MiniMap nodeStrokeWidth={3} zoomable pannable position="bottom-left" />
        </div>
        
        {/* Responsive Legend Panel */}
        <Panel position="top-left" className={cn(
          "bg-white/95 backdrop-blur shadow-xl border border-stone-200 transition-all duration-300 overflow-hidden",
          showLegend ? "w-64 rounded-2xl p-4" : "w-10 h-10 rounded-full p-0 flex items-center justify-center"
        )}>
          {showLegend ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-bold text-amber-900 flex items-center gap-2">🌳 Gia Phả</h1>
                <button onClick={() => setShowLegend(false)} className="p-1 hover:bg-stone-100 rounded-full">
                  <X className="w-4 h-4 text-stone-400" />
                </button>
              </div>
              
              <div className="space-y-3 border-t border-stone-100 pt-4">
                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <div className="w-8 border-t-2 border-dashed border-pink-300" />
                  <span>Quan hệ Vợ - Chồng</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <div className="w-8 border-t-2 border-slate-300" />
                  <span>Quan hệ Cha/Mẹ - Con</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px]">👨</div>
                  <span>Thành viên Nam</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <div className="w-5 h-5 rounded-full bg-pink-50 flex items-center justify-center text-[10px]">👩</div>
                  <span>Thành viên Nữ</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col gap-2">
                <Link href="/" className="inline-flex items-center justify-center px-4 py-2 bg-amber-800 text-white text-xs font-bold rounded-lg hover:bg-amber-900 transition">
                  ← Về trang chủ
                </Link>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setShowLegend(true)}
              className="w-full h-full flex items-center justify-center text-lg hover:bg-stone-50 transition"
              title="Xem chú thích"
            >
              ℹ️
            </button>
          )}
        </Panel>
      </ReactFlow>

      <MemberProfileModal memberId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
