import { X, Calendar, MapPin, Briefcase } from "lucide-react";
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

    const fetchMember = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/members/${memberId}`);
        if (res.ok) {
          const data = await res.json();
          setMember(data);
        }
      } catch (error) {
        console.error("Failed to fetch member details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId]);

  if (!memberId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {loading ? (
          <div className="p-8 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : member ? (
          <>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center">
              <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">
                {member.images?.[0] ? (
                  <img src={member.images[0]} alt={member.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  "👤"
                )}
              </div>
              <h2 className="text-2xl font-bold">{member.name}</h2>
              {member.culturalInfo?.title && (
                <p className="text-blue-100 mt-1">{member.culturalInfo.title}</p>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Sinh - Tử</p>
                  <p className="text-sm text-gray-500">
                    {member.birthDate ? new Date(member.birthDate).toLocaleDateString("vi-VN") : "Chưa rõ"} -{" "}
                    {member.deathDate ? new Date(member.deathDate).toLocaleDateString("vi-VN") : "Nay"}
                  </p>
                </div>
              </div>

              {member.address && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Địa chỉ / Quê quán</p>
                    <p className="text-sm text-gray-500">{member.address}</p>
                  </div>
                </div>
              )}

              {member.job && (
                <div className="flex items-center text-gray-700">
                  <Briefcase className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Nghề nghiệp</p>
                    <p className="text-sm text-gray-500">{member.job}</p>
                  </div>
                </div>
              )}

              {member.bio && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium mb-2">Tiểu sử</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{member.bio}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500 h-64 flex flex-col justify-center">
            Không tìm thấy thông tin
          </div>
        )}
      </div>
    </div>
  );
}
