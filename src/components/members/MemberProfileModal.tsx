"use client";

import { X, Calendar, MapPin, Briefcase, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { IMember } from "@/models/Member";

interface MemberProfileModalProps {
  memberId: string | null;
  onClose: () => void;
}

export default function MemberProfileModal({ memberId, onClose }: MemberProfileModalProps) {
  const [member, setMember] = useState<IMember | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;

    async function load() {
      if (!cancelled) {
        setMember(null);
        setLoading(true);
      }
      try {
        const r = await fetch(`/api/members/${memberId}`);
        const data = r.ok ? await r.json() : null;
        if (!cancelled) setMember(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [memberId]);

  if (!memberId) return null;

  const isMale = member?.gender === "male";
  const accentClass = isMale
    ? "from-blue-600 to-blue-800"
    : "from-pink-500 to-rose-600";

  const formatDate = (d?: Date) =>
    d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "Chưa rõ";

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${accentClass} px-6 pt-6 pb-10 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse" />
              <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
            </div>
          ) : member ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-4xl shadow-inner mb-3">
                {member.images?.[0]
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={member.images[0]} alt={member.name} className="w-full h-full rounded-full object-cover" />
                  : (member.gender === "female" ? "👩" : "👨")}
              </div>
              <h2 className="text-xl font-bold">{member.name}</h2>
              {member.culturalInfo?.hanNomName && (
                <p className="text-sm text-white/80 mt-0.5">{member.culturalInfo.hanNomName}</p>
              )}
              {member.culturalInfo?.title && (
                <span className="mt-2 text-xs px-3 py-0.5 bg-white/20 rounded-full">
                  {member.culturalInfo.title}
                  {member.culturalInfo.generation && ` • Đời thứ ${member.culturalInfo.generation}`}
                </span>
              )}
            </div>
          ) : (
            <p className="text-center opacity-70">Không tìm thấy thông tin</p>
          )}
        </div>

        {/* Body — overlaps the gradient slightly */}
        {member && (
          <div className="overflow-y-auto -mt-6 bg-white rounded-t-2xl px-6 pt-5 pb-6 space-y-4">
            {/* Dates */}
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Ngày sinh – Ngày mất</p>
                <p className="text-sm text-slate-700">
                  {formatDate(member.birthDate)} – {member.deathDate ? formatDate(member.deathDate) : "Nay"}
                </p>
              </div>
            </div>

            {member.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Quê quán / Địa chỉ</p>
                  <p className="text-sm text-slate-700">{member.address}</p>
                </div>
              </div>
            )}

            {member.job && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Nghề nghiệp</p>
                  <p className="text-sm text-slate-700">{member.job}</p>
                </div>
              </div>
            )}

            {member.bio && (
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Tiểu sử</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{member.bio}</p>
                </div>
              </div>
            )}

            {/* Relations */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quan hệ gia đình</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Cha</p>
                  <p className="text-sm font-medium text-slate-800">
                    {(member.fatherId as any)?.name || "Chưa rõ"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Mẹ</p>
                  <p className="text-sm font-medium text-slate-800">
                    {(member.motherId as any)?.name || "Chưa rõ"}
                  </p>
                </div>
              </div>

              {member.spouseIds && member.spouseIds.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Vợ / Chồng</p>
                  <div className="flex flex-wrap gap-2">
                    {member.spouseIds.map((sp: any) => (
                      <span key={sp._id} className="text-sm font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded">
                        {sp.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
