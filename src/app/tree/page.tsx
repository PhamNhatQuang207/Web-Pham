import FamilyTree from "@/components/tree/FamilyTree";

export const metadata = {
  title: "Cây Gia Phả | Quản Lý Dòng Họ",
  description: "Trực quan hóa cây gia phả dòng họ",
};

export default function TreePage() {
  return (
    <main className="w-full h-screen">
      <FamilyTree />
    </main>
  );
}
