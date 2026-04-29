"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import MemberProfileModal from "../members/MemberProfileModal";
import { IMember } from "@/models/Member";

import MemberNode from "./MemberNode";

// ── Constants ────────────────────────────────────────────────────────────────
const NW = 160;        // node width (w-40 = 160px)
const NH = 90;         // node height (h-auto but roughly 90px)
const SPOUSE_GAP = 32; // gap between spouses
const H_GAP = 40;      // gap between sibling groups
const V_GAP = 80;      // vertical gap between generations
const PAD = 80;        // canvas padding

// ── Tree structure ───────────────────────────────────────────────────────────
// A unit is a primary member and their spouses.
// To handle multiple spouses, we need to track children per spouse.
interface ChildGroup {
  spouseId: string | null; // null if child has no known other parent in this unit
  children: Unit[];
}

interface Unit {
  primary: IMember;
  spouses: IMember[];
  childGroups: ChildGroup[];
}

function buildUnits(members: IMember[]): Unit[] {
  const byId: Record<string, IMember> = {};
  members.forEach((m) => { byId[m._id] = m; });

  const childrenOfPrimary: Record<string, IMember[]> = {};
  members.forEach((m) => {
    if (m.fatherId) {
      const fid = m.fatherId.toString();
      if (!childrenOfPrimary[fid]) childrenOfPrimary[fid] = [];
      childrenOfPrimary[fid].push(m);
    }
    if (m.motherId) {
      const mid = m.motherId.toString();
      if (!childrenOfPrimary[mid]) childrenOfPrimary[mid] = [];
      childrenOfPrimary[mid].push(m);
    }
  });

  const visited = new Set<string>();

  function buildUnit(m: IMember): Unit {
    visited.add(m._id);
    
    // Find spouses
    const spouses: IMember[] = [];
    if (m.spouseIds && m.spouseIds.length > 0) {
      m.spouseIds.forEach((spIdRaw) => {
        const spId = spIdRaw.toString();
        if (byId[spId] && !visited.has(spId)) {
          spouses.push(byId[spId]);
          visited.add(spId);
        }
      });
    }

    // Group children by spouse
    const childGroups: ChildGroup[] = [];
    
    // Initialize groups for each spouse + one for "unknown/no spouse"
    spouses.forEach(sp => childGroups.push({ spouseId: sp._id, children: [] }));
    const noSpouseGroup: ChildGroup = { spouseId: null, children: [] };
    
    const childrenSet = new Set<IMember>();
    (childrenOfPrimary[m._id] || []).forEach(child => childrenSet.add(child));
    spouses.forEach(sp => {
      (childrenOfPrimary[sp._id] || []).forEach(child => childrenSet.add(child));
    });

    childrenSet.forEach(child => {
      if (visited.has(child._id)) return;
      
      const childFid = child.fatherId?.toString();
      const childMid = child.motherId?.toString();
      
      // Determine which spouse this child belongs to
      let assignedSpouseId: string | null = null;
      for (const sp of spouses) {
        if (childFid === sp._id || childMid === sp._id) {
          assignedSpouseId = sp._id;
          break;
        }
      }

      const childUnit = buildUnit(child);
      
      if (assignedSpouseId) {
        const group = childGroups.find(g => g.spouseId === assignedSpouseId);
        if (group) group.children.push(childUnit);
      } else {
        noSpouseGroup.children.push(childUnit);
      }
    });

    if (noSpouseGroup.children.length > 0) {
      childGroups.unshift(noSpouseGroup); // Put "no spouse" children first (under primary)
    }

    return { primary: m, spouses, childGroups };
  }

  const roots: Unit[] = [];
  members.forEach((m) => {
    if (!m.fatherId && !m.motherId && !visited.has(m._id)) {
      roots.push(buildUnit(m));
    }
  });
  return roots;
}

// ── Layout ───────────────────────────────────────────────────────────────────
interface LayoutChildGroup {
  spouseId: string | null;
  cx: number;
  children: LayoutUnit[];
}

interface LayoutUnit {
  x: number; // Left-most x position of the primary member
  y: number;
  unit: Unit;
  spousesX: number[]; // x positions for each spouse
  childGroups: LayoutChildGroup[];
}

function unitW(u: Unit): number {
  // Width of parents: primary + spouses
  const parentsW = NW + (u.spouses.length * (NW + SPOUSE_GAP));
  
  // Width of children
  let childrenW = 0;
  u.childGroups.forEach(cg => {
    if (cg.children.length > 0) {
      const cgW = cg.children.reduce((s, c) => s + unitW(c), 0) + H_GAP * (cg.children.length - 1);
      childrenW += cgW + H_GAP; // Add H_GAP between groups
    }
  });
  if (childrenW > 0) childrenW -= H_GAP;

  return Math.max(parentsW, childrenW);
}

function layout(u: Unit, startX: number, y: number): LayoutUnit {
  const w = unitW(u);
  // Center parents over the allocated width
  const parentsW = NW + (u.spouses.length * (NW + SPOUSE_GAP));
  const parentsStartX = startX + (w - parentsW) / 2;
  
  const spousesX: number[] = [];
  let curSpouseX = parentsStartX + NW + SPOUSE_GAP;
  u.spouses.forEach(() => {
    spousesX.push(curSpouseX);
    curSpouseX += NW + SPOUSE_GAP;
  });

  let curChildX = startX;
  const layoutChildGroups: LayoutChildGroup[] = [];

  u.childGroups.forEach(cg => {
    if (cg.children.length === 0) return;
    
    const cgChildrenW = cg.children.reduce((s, c) => s + unitW(c), 0) + H_GAP * (cg.children.length - 1);
    
    // Determine the anchor point for this child group (center between primary and the specific spouse, or just primary)
    let parentAnchorX = parentsStartX + NW / 2;
    if (cg.spouseId) {
      const spIdx = u.spouses.findIndex(s => s._id === cg.spouseId);
      if (spIdx !== -1) {
        const spX = spousesX[spIdx];
        parentAnchorX = (parentsStartX + NW / 2 + spX + NW / 2) / 2;
      }
    }

    // Try to center children under their parent anchor, but respect curChildX to avoid overlapping
    let groupStartX = Math.max(curChildX, parentAnchorX - cgChildrenW / 2);
    
    const children: LayoutUnit[] = [];
    let childX = groupStartX;
    cg.children.forEach(c => {
      const cw = unitW(c);
      children.push(layout(c, childX, y + NH + V_GAP));
      childX += cw + H_GAP;
    });

    layoutChildGroups.push({
      spouseId: cg.spouseId,
      cx: groupStartX + cgChildrenW / 2,
      children
    });

    curChildX = childX;
  });

  return { x: parentsStartX, y, unit: u, spousesX, childGroups: layoutChildGroups };
}

// ── Bounds ───────────────────────────────────────────────────────────────────
function bounds(nodes: LayoutUnit[], acc = { minX: Infinity, maxX: -Infinity, maxY: 0 }) {
  nodes.forEach((n) => {
    acc.minX = Math.min(acc.minX, n.x);
    if (n.spousesX.length > 0) {
      acc.maxX = Math.max(acc.maxX, n.spousesX[n.spousesX.length - 1] + NW);
    } else {
      acc.maxX = Math.max(acc.maxX, n.x + NW);
    }
    acc.maxY = Math.max(acc.maxY, n.y + NH);
    
    n.childGroups.forEach(cg => bounds(cg.children, acc));
  });
  return acc;
}

// ── SVG pieces ───────────────────────────────────────────────────────────────
function Connections({ node, ox }: { node: LayoutUnit; ox: number }) {
  const { x, y, unit, spousesX, childGroups } = node;
  const lines: React.ReactNode[] = [];

  // Spouse connectors (chain them)
  let prevSpouseX = x;
  spousesX.forEach((spX, idx) => {
    lines.push(
      <line key={`sp-${unit.primary._id}-${idx}`}
        x1={prevSpouseX + NW + ox} y1={y + NH / 2}
        x2={spX + ox} y2={y + NH / 2}
        stroke="#f9a8d4" strokeWidth={2.5} strokeDasharray="6 3" />
    );
    prevSpouseX = spX;
  });

  // Parent → children
  childGroups.forEach(cg => {
    if (cg.children.length === 0) return;

    let parentAnchorX = x + NW / 2;
    if (cg.spouseId) {
      const spIdx = unit.spouses.findIndex(s => s._id === cg.spouseId);
      if (spIdx !== -1) {
        parentAnchorX = (x + NW / 2 + spousesX[spIdx] + NW / 2) / 2;
        
        // Draw a tiny vertical tick from the spouse line down to start the child line
        lines.push(
          <line key={`vsp-${unit.primary._id}-${cg.spouseId}`}
            x1={parentAnchorX + ox} y1={y + NH / 2}
            x2={parentAnchorX + ox} y2={y + NH}
            stroke="#94a3b8" strokeWidth={1.5} />
        );
      }
    }

    const midY = y + NH + 24;
    const barY = y + NH + V_GAP - 24;

    // Line from parent anchor down
    lines.push(
      <line key={`vd-${unit.primary._id}-${cg.spouseId}`}
        x1={parentAnchorX + ox} y1={y + NH}
        x2={parentAnchorX + ox} y2={midY}
        stroke="#94a3b8" strokeWidth={1.5} />
    );

    if (cg.children.length === 1) {
      const childCenter = cg.children[0].x + NW / 2;
      lines.push(
        <path key={`sc-${unit.primary._id}-${cg.children[0].unit.primary._id}`}
          d={`M ${parentAnchorX + ox} ${midY} L ${childCenter + ox} ${midY} L ${childCenter + ox} ${cg.children[0].y}`}
          stroke="#94a3b8" strokeWidth={1.5} fill="none" />
      );
    } else {
      const l = cg.children[0].x + NW / 2 + ox;
      const r = cg.children[cg.children.length - 1].x + NW / 2 + ox;
      lines.push(<line key={`hb-${unit.primary._id}-${cg.spouseId}`} x1={l} y1={midY} x2={r} y2={midY} stroke="#94a3b8" strokeWidth={1.5} />);
      cg.children.forEach((ch) =>
        lines.push(<line key={`vc-${ch.unit.primary._id}`} x1={ch.x + NW / 2 + ox} y1={midY} x2={ch.x + NW / 2 + ox} y2={ch.y} stroke="#94a3b8" strokeWidth={1.5} />)
      );
    }
  });

  return (
    <>
      {lines}
      {childGroups.map(cg => cg.children.map(ch => <Connections key={ch.unit.primary._id} node={ch} ox={ox} />))}
    </>
  );
}

function Nodes({ node, ox, onSelect }: { node: LayoutUnit; ox: number; onSelect: (id: string) => void }) {
  const { x, y, unit, spousesX, childGroups } = node;
  return (
    <>
      <foreignObject x={x + ox} y={y} width={NW} height={NH + 20} className="overflow-visible">
        <MemberNode data={{ label: unit.primary.name, gender: unit.primary.gender, birthDate: unit.primary.birthDate, deathDate: unit.primary.deathDate, onClick: () => onSelect(unit.primary._id) }} />
      </foreignObject>
      {unit.spouses.map((sp, idx) => (
        <foreignObject key={sp._id} x={spousesX[idx] + ox} y={y} width={NW} height={NH + 20} className="overflow-visible">
          <MemberNode data={{ label: sp.name, gender: sp.gender, birthDate: sp.birthDate, deathDate: sp.deathDate, onClick: () => onSelect(sp._id) }} />
        </foreignObject>
      ))}
      {childGroups.map(cg => cg.children.map((ch) => <Nodes key={ch.unit.primary._id} node={ch} ox={ox} onSelect={onSelect} />))}
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function FamilyTree() {
  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMembers)
      .catch(() => setError("Không tải được dữ liệu."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-stone-50 flex-col gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      <p className="text-stone-500 text-sm">Đang tải gia phả…</p>
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-stone-50">
      <p className="text-red-500">{error}</p>
    </div>
  );

  const roots = buildUnits(members);
  const layoutRoots = (() => {
    let totalW = roots.reduce((s, u) => s + unitW(u), 0) + H_GAP * (roots.length - 1);
    let cur = -totalW / 2;
    return roots.map((u) => {
      const w = unitW(u);
      const node = layout(u, cur, PAD);
      cur += w + H_GAP;
      return node;
    });
  })();

  const b = layoutRoots.length > 0 ? bounds(layoutRoots) : { minX: 0, maxX: 0, maxY: 0 };
  const treeW = b.maxX - b.minX;
  const screenW = typeof window !== "undefined" ? window.innerWidth : 1200;
  // Make SVG at least screen width so flex-center doesn't cut off when scaled
  const svgW = Math.max(treeW + PAD * 2, screenW);
  // Center the tree horizontally inside the svg
  const offsetX = -b.minX + (svgW - treeW) / 2;
  const svgH = Math.max(b.maxY + PAD * 2, 800);

  return (
    <div className="flex flex-col h-screen bg-[#f5f0eb]" suppressHydrationWarning>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 bg-white border-b border-stone-200 shadow-sm shrink-0">
        <span className="text-lg font-bold text-amber-800">🌳 Cây Gia Phả</span>
        <span className="text-stone-400 text-xs hidden sm:inline">• Click vào thành viên để xem chi tiết</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.15, 2))} className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-bold">＋</button>
          <button onClick={() => setZoom(1)} className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-500 text-xs">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.3))} className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-bold">－</button>
          <Link href="/" className="ml-2 text-xs text-stone-500 hover:text-amber-700">← Trang chủ</Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-1.5 bg-stone-100 border-b border-stone-200 text-xs text-stone-500 shrink-0">
        <span className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-pink-300 inline-block" /> Vợ – Chồng</span>
        <span className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-slate-400 inline-block" /> Cha/mẹ – Con</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-200 border-2 border-blue-400 inline-block" /> Nam</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-pink-200 border-2 border-pink-400 inline-block" /> Nữ</span>
      </div>

      {/* SVG canvas */}
      <div className="flex-1 overflow-auto">
        <div style={{ transformOrigin: "top center", transform: `scale(${zoom})`, transition: "transform 0.2s" }}>
          <svg ref={svgRef} width={svgW} height={svgH} style={{ display: "block", margin: "0 auto" }}>
            <rect width={svgW} height={svgH} fill="#f5f0eb" />
            {/* dot pattern background */}
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#d6cdc5" />
              </pattern>
            </defs>
            <rect width={svgW} height={svgH} fill="url(#dots)" />

            {/* Connections (drawn first, behind nodes) */}
            {layoutRoots.map((node) => (
              <Connections key={node.unit.primary._id} node={node} ox={offsetX} />
            ))}

            {/* Nodes */}
            {layoutRoots.map((node) => (
              <Nodes key={node.unit.primary._id} node={node} ox={offsetX} onSelect={setSelected} />
            ))}
          </svg>
        </div>
      </div>

      <MemberProfileModal memberId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
