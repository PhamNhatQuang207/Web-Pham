import Link from "next/link";
import { Users, BookOpen, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-200 text-stone-800 font-sans selection:bg-amber-200">
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-24 flex flex-col items-center text-center">
        
        {/* Hero Section */}
        <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-stone-900 drop-shadow-sm">
            Gia Phả <span className="text-amber-700">Dòng Họ</span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-600 leading-relaxed font-light">
            Nơi lưu giữ nguồn cội, kết nối các thế hệ và gìn giữ truyền thống gia đình cho muôn đời sau.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/tree" 
              className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Xem Cây Gia Phả
            </Link>
            <Link 
              href="/login" 
              className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-sm hover:shadow-md"
            >
              Đăng nhập thành viên
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 w-full">
          <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-stone-800">Trực quan hóa</h3>
            <p className="text-stone-600 leading-relaxed">
              Cây gia phả được vẽ tự động, dễ dàng theo dõi các thế hệ, tra cứu quan hệ gia tộc một cách rõ ràng.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <BookOpen size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-stone-800">Lưu trữ chi tiết</h3>
            <p className="text-stone-600 leading-relaxed">
              Hồ sơ mỗi thành viên lưu trữ đầy đủ ngày sinh, ngày mất, quê quán, tiểu sử và hình ảnh tư liệu.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-stone-800">Bảo mật & Phân quyền</h3>
            <p className="text-stone-600 leading-relaxed">
              Thông tin được bảo vệ. Phân quyền rõ ràng giữa Quản trị viên, Người biên tập và Khách tham quan.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
