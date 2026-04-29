"use client";

import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { IMember } from "@/models/Member";

interface FamilyNodeData {
  primary: IMember;
  spouses: IMember[];
  onMemberClick: (id: string) => void;
}

function MemberCard({ m, onClick }: { m: IMember; onClick: () => void }) {
  const isMale = m.gender === "male";
  const isDeceased = !!m.deathDate;
  const yr = (d?: Date | string) => d ? new Date(d).getFullYear() : "?";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "w-36 flex flex-col items-center gap-1 py-2 px-2 rounded-xl shadow-sm transition-all border-2 bg-white cursor-pointer select-none active:scale-95",
        isMale ? "border-blue-200 hover:border-blue-400" : "border-pink-200 hover:border-pink-400",
        isDeceased && "bg-stone-50 grayscale-[0.3]"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm",
        isMale ? "bg-blue-50 text-blue-500" : "bg-pink-50 text-pink-500"
      )}>
        {m.gender === "female" ? "👩" : "👨"}
      </div>
      <span className="text-[10px] font-bold text-stone-800 text-center leading-tight line-clamp-1">
        {m.name}
      </span>
      <span className="text-[8px] text-stone-400">
        {yr(m.birthDate)} – {m.deathDate ? yr(m.deathDate) : "nay"}
      </span>
    </div>
  );
}

export default function FamilyNode({ data }: { data: FamilyNodeData }) {
  const { primary, spouses, onMemberClick } = data;
  
  // Split spouses for centering
  const half = Math.ceil(spouses.length / 2);
  const leftSpouses = spouses.slice(0, half);
  const rightSpouses = spouses.slice(half);

  return (
    <div className="p-3 bg-stone-100/50 border border-stone-200 rounded-2xl shadow-lg flex flex-col items-center gap-2">
      <Handle type="target" position={Position.Top} className="!bg-stone-400 !w-2 !h-2" />
      
      <div className="flex items-center gap-2">
        {/* Left Spouses */}
        {leftSpouses.map(sp => (
          <div key={sp._id} className="flex items-center gap-1">
            <MemberCard m={sp} onClick={() => onMemberClick(sp._id)} />
            <div className="w-4 border-t-2 border-dashed border-pink-200" />
          </div>
        ))}

        {/* Primary Member */}
        <MemberCard m={primary} onClick={() => onMemberClick(primary._id)} />

        {/* Right Spouses */}
        {rightSpouses.map(sp => (
          <div key={sp._id} className="flex items-center gap-1">
            <div className="w-4 border-t-2 border-dashed border-pink-200" />
            <MemberCard m={sp} onClick={() => onMemberClick(sp._id)} />
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-stone-400 !w-2 !h-2" />
    </div>
  );
}
