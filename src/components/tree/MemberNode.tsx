import { Handle, Position } from "@xyflow/react";
import { User, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberNodeProps {
  data: {
    label: string;
    gender: "male" | "female" | "other";
    birthDate?: string;
    deathDate?: string;
    isSpouse?: boolean;
    onClick?: () => void;
  };
}

export default function MemberNode({ data }: MemberNodeProps) {
  const isMale = data.gender === "male";
  const isFemale = data.gender === "female";

  return (
    <div
      onClick={data.onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-3 rounded-lg shadow-md border-2 bg-white min-w-[120px] cursor-pointer hover:shadow-lg transition-all",
        isMale ? "border-blue-400" : isFemale ? "border-pink-400" : "border-gray-400",
        data.isSpouse && "border-dashed"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-2",
        isMale ? "bg-blue-100 text-blue-600" : isFemale ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"
      )}>
        {isFemale ? <UserRound size={24} /> : <User size={24} />}
      </div>
      
      <div className="text-sm font-bold text-gray-800 text-center">{data.label}</div>
      
      {(data.birthDate || data.deathDate) && (
        <div className="text-xs text-gray-500 mt-1">
          {data.birthDate ? new Date(data.birthDate).getFullYear() : "?"} - {" "}
          {data.deathDate ? new Date(data.deathDate).getFullYear() : ""}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      {data.isSpouse && (
        <Handle type="target" position={Position.Left} id="spouse" className="!bg-pink-400" />
      )}
    </div>
  );
}
