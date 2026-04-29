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
        // In a patriarchal tree, each male who is a parent starts a "FamilyNode"
        const families: Record<string, { primary: IMember; spouses: IMember[] }> = {};
        const byId: Record<string, IMember> = {};
        members.forEach((m) => (byId[m._id] = m));

        members.forEach((m) => {
          // If male and has wives or children, he's a primary of a family
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

          // Connect to father's family node
          if (fam.primary.fatherId) {
            initialEdges.push({
              id: `e-${fam.primary.fatherId}-${fam.primary._id}`,
              source: fam.primary.fatherId.toString(),
              target: fam.primary._id,
              animated: true,
              style: { stroke: "#94a3b8", strokeWidth: 2 },
            });
          }
        });

        // Add children who are NOT primaries (unmarried sons/daughters)
        members.forEach((m) => {
          if (m.gender === "female" && !m.spouseIds?.length && !m.fatherId) return; // Skip root females if any
          
          // If this member is NOT a primary of a family node
          if (!families[m._id]) {
            // But has a father, add them as a leaf node
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
                type: "family", // Reuse FamilyNode for consistency
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
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background color="#d6cdc5" gap={20} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        
        <Panel position="top-left" className="bg-white/80 backdrop-blur p-4 rounded-xl shadow-lg border border-stone-200">
          <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            🌳 Gia Phả Dòng Họ Phạm
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            • Kéo để di chuyển • Cuộn để phóng to • Click để xem chi tiết
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/" className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg transition">
              ← Trang chủ
            </Link>
          </div>
        </Panel>
      </ReactFlow>

      <MemberProfileModal memberId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
