"use client";

import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface MemberNodeData {
  label: string;
  gender: "male" | "female" | "other";
  birthDate?: string | Date;
  deathDate?: string | Date;
  onClick?: () => void;
}

interface MemberNodeProps {
  data: MemberNodeData;
  selected?: boolean;
}

function formatYear(date?: string | Date): string {
  if (!date) return "?";
  return new Date(date).getFullYear().toString();
}

export default function MemberNode({ data, selected }: MemberNodeProps) {
  const isMale = data.gender === "male";
  const isFemale = data.gender === "female";
  const isDeceased = !!data.deathDate;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 !border-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-400 !border-0 opacity-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-pink-300 !border-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-pink-300 !border-0 opacity-0"
      />

      <button
        onClick={data.onClick}
        className={cn(
          "w-40 flex flex-col items-center gap-1 py-3 px-3 rounded-2xl shadow-md transition-all duration-200 focus:outline-none",
          "border-2 bg-white",
          isMale
            ? "border-blue-300 hover:border-blue-500 hover:shadow-blue-100"
            : isFemale
            ? "border-pink-300 hover:border-pink-500 hover:shadow-pink-100"
            : "border-slate-300 hover:border-slate-500",
          selected && "ring-2 ring-amber-400 ring-offset-1",
          "hover:shadow-lg hover:-translate-y-0.5",
          isDeceased && "bg-stone-50"
        )}
      >
        {/* Avatar circle */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg mb-0.5",
            isMale
              ? "bg-blue-100 text-blue-600"
              : isFemale
              ? "bg-pink-100 text-pink-600"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {isFemale ? "👩" : "👨"}
        </div>

        {/* Name */}
        <span className="text-xs font-semibold text-stone-800 text-center leading-tight line-clamp-2">
          {data.label}
        </span>

        {/* Years */}
        <span className="text-[10px] text-stone-400 leading-none">
          {formatYear(data.birthDate)}
          {" – "}
          {data.deathDate ? formatYear(data.deathDate) : "nay"}
        </span>

        {/* Deceased badge */}
        {isDeceased && (
          <span className="text-[9px] text-stone-400 italic">đã mất</span>
        )}
      </button>
    </>
  );
}
