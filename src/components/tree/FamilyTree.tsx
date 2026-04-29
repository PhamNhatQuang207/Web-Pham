"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import MemberNode from "./MemberNode";
import MemberProfileModal from "../members/MemberProfileModal";
import { IMember } from "@/models/Member";

const nodeTypes = {
  memberNode: MemberNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 150;
const nodeHeight = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    // Make spouse edges have less weight on the layout ranking if possible
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

export default function FamilyTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        if (res.ok) {
          const members: IMember[] = await res.json();
          
          const initialNodes: Node[] = [];
          const initialEdges: Edge[] = [];

          members.forEach((member) => {
            initialNodes.push({
              id: member._id,
              type: "memberNode",
              position: { x: 0, y: 0 },
              data: {
                label: member.name,
                gender: member.gender,
                birthDate: member.birthDate,
                deathDate: member.deathDate,
                isSpouse: !!member.spouseId,
                onClick: () => setSelectedMemberId(member._id),
              },
            });

            if (member.parentId) {
              initialEdges.push({
                id: `e-${member.parentId}-${member._id}`,
                source: member.parentId.toString(),
                target: member._id,
                type: "smoothstep",
                animated: true,
                style: { stroke: "#9ca3af", strokeWidth: 2 },
              });
            }

            if (member.spouseId) {
              initialEdges.push({
                id: `e-spouse-${member._id}-${member.spouseId}`,
                source: member._id,
                target: member.spouseId.toString(),
                type: "step",
                style: { stroke: "#f472b6", strokeWidth: 2, strokeDasharray: "5,5" },
                animated: false,
              });
            }
          });

          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges
          );

          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        }
      } catch (error) {
        console.error("Failed to fetch family tree data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [setNodes, setEdges]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Đang tải gia phả...</div>;
  }

  return (
    <div className="w-full h-screen bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <Background gap={12} size={1} />
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
