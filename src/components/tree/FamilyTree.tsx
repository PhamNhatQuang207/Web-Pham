"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import MemberProfileModal from "../members/MemberProfileModal";
import { IMember } from "@/models/Member";

// ── Constants ────────────────────────────────────────────────────────────────
const NW = 140;        // node width
const NH = 76;         // node height
const SPOUSE_GAP = 28; // gap between spouses
const H_GAP = 60;      // gap between sibling groups
const V_GAP = 120;     // vertical gap between generations
const PAD = 80;        // canvas padding

// ── Tree structure ───────────────────────────────────────────────────────────
interface Unit {
  primary: IMember;
  spouse?: IMember;
  children: Unit[];
}

function buildUnits(members: IMember[]): Unit[] {
  const byId: Record<string, IMember> = {};
  members.forEach((m) => { byId[m._id] = m; });

  const childrenOf: Record<string, string[]> = {};
  members.forEach((m) => {
    if (m.parentId) {
      const pid = m.parentId.toString();
      if (!childrenOf[pid]) childrenOf[pid] = [];
      childrenOf[pid].push(m._id);
    }
  });

  const visited = new Set<string>();

  function buildUnit(m: IMember): Unit {
    visited.add(m._id);
    const spId = m.spouseId?.toString();
    let spouse: IMember | undefined;
    if (spId && byId[spId] && !visited.has(spId)) {
      spouse = byId[spId];
      visited.add(spId);
    }
    const childIds = new Set([
      ...(childrenOf[m._id] || []),
      ...(spouse ? childrenOf[spouse._id] || [] : []),
    ]);
    const children: Unit[] = [];
    childIds.forEach((cid) => {
      if (!visited.has(cid) && byId[cid]) children.push(buildUnit(byId[cid]));
    });
    return { primary: m, spouse, children };
  }

  const roots: Unit[] = [];
  members.forEach((m) => {
    if (!m.parentId && !visited.has(m._id)) roots.push(buildUnit(m));
  });
  return roots;
}

// ── Layout ───────────────────────────────────────────────────────────────────
interface LayoutUnit {
  cx: number; // center-x of the couple
  y: number;
  unit: Unit;
  children: LayoutUnit[];
}

function unitW(u: Unit): number {
  const selfW = u.spouse ? NW * 2 + SPOUSE_GAP : NW;
  if (u.children.length === 0) return selfW;
  const childrenW =
    u.children.reduce((s, c) => s + unitW(c), 0) + H_GAP * (u.children.length - 1);
  return Math.max(selfW, childrenW);
}

function layout(u: Unit, cx: number, y: number): LayoutUnit {
  const childrenW =
    u.children.length > 0
      ? u.children.reduce((s, c) => s + unitW(c), 0) + H_GAP * (u.children.length - 1)
      : 0;
  let cur = cx - childrenW / 2;
  const children: LayoutUnit[] = u.children.map((c) => {
    const cw = unitW(c);
    const node = layout(c, cur + cw / 2, y + NH + V_GAP);
    cur += cw + H_GAP;
    return node;
  });
  return { cx, y, unit: u, children };
}

// ── Bounds ───────────────────────────────────────────────────────────────────
function bounds(nodes: LayoutUnit[], acc = { minX: Infinity, maxX: -Infinity, maxY: 0 }) {
  nodes.forEach((n) => {
    const hw = n.unit.spouse ? NW + SPOUSE_GAP / 2 : NW / 2;
    acc.minX = Math.min(acc.minX, n.cx - hw);
    acc.maxX = Math.max(acc.maxX, n.cx + hw);
    acc.maxY = Math.max(acc.maxY, n.y + NH);
    bounds(n.children, acc);
  });
  return acc;
}

// ── SVG pieces ───────────────────────────────────────────────────────────────
function yr(d?: Date | string) {
  return d ? new Date(d).getFullYear() : "?";
}

function Card({
  m, x, y, onClick,
}: { m: IMember; x: number; y: number; onClick: () => void }) {
  const female = m.gender === "female";
  const dead = !!m.deathDate;
  const accent = female ? "#f472b6" : "#60a5fa";
  const bg = dead ? "#f5f0eb" : "#ffffff";
  const name = m.name.length > 13 ? m.name.slice(0, 12) + "…" : m.name;
  const years = `${yr(m.birthDate)}${dead ? ` – ${yr(m.deathDate)}` : ""}`;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <rect x={x+2} y={y+2} width={NW} height={NH} rx={10} fill="rgba(0,0,0,0.07)" />
      <rect x={x} y={y} width={NW} height={NH} rx={10} fill={bg} stroke={accent} strokeWidth={2} />
      <rect x={x} y={y} width={NW} height={8} rx={4} fill={accent} />
      <rect x={x} y={y+4} width={NW} height={4} fill={accent} />
      <circle cx={x+20} cy={y+36} r={13} fill={female ? "#fce7f3" : "#dbeafe"} stroke={accent} strokeWidth={1.5} />
      <text x={x+20} y={y+41} textAnchor="middle" fontSize={14}>{female ? "👩" : "👨"}</text>
      <text x={x+38} y={y+29} fontSize={11} fontWeight={700} fill="#1c1917">{name}</text>
      <text x={x+38} y={y+43} fontSize={9.5} fill="#78716c">{years}</text>
      {m.culturalInfo?.generation && (
        <text x={x+38} y={y+57} fontSize={9} fill="#a8a29e">Đời {m.culturalInfo.generation}</text>
      )}
    </g>
  );
}

function Connections({ node, ox }: { node: LayoutUnit; ox: number }) {
  const { cx, y, unit, children } = node;
  const lines: React.ReactNode[] = [];

  // Spouse connector
  if (unit.spouse) {
    lines.push(
      <line key={`sp-${unit.primary._id}`}
        x1={cx - SPOUSE_GAP / 2 + ox} y1={y + NH / 2}
        x2={cx + SPOUSE_GAP / 2 + ox} y2={y + NH / 2}
        stroke="#f9a8d4" strokeWidth={2.5} strokeDasharray="6 3" />
    );
  }

  // Parent → children
  if (children.length > 0) {
    const midY = y + NH + 24;
    const barY = y + NH + V_GAP - 24;

    lines.push(
      <line key={`vd-${unit.primary._id}`}
        x1={cx + ox} y1={y + NH}
        x2={cx + ox} y2={midY}
        stroke="#94a3b8" strokeWidth={1.5} />
    );

    if (children.length === 1) {
      lines.push(
        <line key={`sc-${unit.primary._id}`}
          x1={cx + ox} y1={midY}
          x2={children[0].cx + ox} y2={children[0].y}
          stroke="#94a3b8" strokeWidth={1.5} />
      );
    } else {
      const l = children[0].cx + ox;
      const r = children[children.length - 1].cx + ox;
      lines.push(<line key={`hb-${unit.primary._id}`} x1={l} y1={barY} x2={r} y2={barY} stroke="#94a3b8" strokeWidth={1.5} />);
      lines.push(<line key={`vm-${unit.primary._id}`} x1={cx + ox} y1={midY} x2={cx + ox} y2={barY} stroke="#94a3b8" strokeWidth={1.5} />);
      children.forEach((ch) =>
        lines.push(<line key={`vc-${ch.unit.primary._id}`} x1={ch.cx + ox} y1={barY} x2={ch.cx + ox} y2={ch.y} stroke="#94a3b8" strokeWidth={1.5} />)
      );
    }
  }

  return (
    <>
      {lines}
      {children.map((ch) => <Connections key={ch.unit.primary._id} node={ch} ox={ox} />)}
    </>
  );
}

function Nodes({ node, ox, onSelect }: { node: LayoutUnit; ox: number; onSelect: (id: string) => void }) {
  const { cx, y, unit, children } = node;
  return (
    <>
      {unit.spouse ? (
        <>
          <Card m={unit.primary}  x={cx - NW - SPOUSE_GAP / 2 + ox} y={y} onClick={() => onSelect(unit.primary._id)} />
          <Card m={unit.spouse}   x={cx + SPOUSE_GAP / 2 + ox}       y={y} onClick={() => onSelect(unit.spouse!._id)} />
        </>
      ) : (
        <Card m={unit.primary} x={cx - NW / 2 + ox} y={y} onClick={() => onSelect(unit.primary._id)} />
      )}
      {children.map((ch) => <Nodes key={ch.unit.primary._id} node={ch} ox={ox} onSelect={onSelect} />)}
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
      const node = layout(u, cur + w / 2, PAD);
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
