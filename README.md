# Gia Phả Dòng Họ - Web Application

Dự án ứng dụng web quản lý và trực quan hóa cây gia phả dòng họ. 

## 🚀 Công nghệ sử dụng

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI & Styling**: React, [Tailwind CSS](https://tailwindcss.com/)
- **Biểu đồ cây gia phả**: [@xyflow/react](https://reactflow.dev/) (React Flow) và [Dagre](https://github.com/dagrejs/dagre) (Tự động layout graph)
- **Cơ sở dữ liệu**: MongoDB (thông qua [Mongoose](https://mongoosejs.com/))
- **Xác thực & Phân quyền**: [NextAuth.js v5](https://next-auth.js.org/) (JWT & Credentials)
- **Icons**: [Lucide React](https://lucide.dev/)

## ✨ Tính năng chính

- **Trực quan hóa gia phả**: Cây gia phả được vẽ tự động, dễ dàng zoom, pan, hiển thị rõ ràng quan hệ cha-con, vợ-chồng.
- **Hồ sơ thành viên**: Hiển thị chi tiết ngày sinh, ngày mất, thông tin Hán-Nôm, quê quán, tiểu sử và hình ảnh.
- **Phân quyền người dùng (Role-based access control)**:
  - `ADMIN`: Quản lý hệ thống, phê duyệt các yêu cầu thay đổi thông tin.
  - `EDITOR`: Thêm, sửa thông tin các thành viên.
  - `VIEWER`: Xem gia phả, có thể gửi yêu cầu chỉnh sửa/bổ sung (chờ duyệt).

## 🛠 Hướng dẫn Cài đặt & Chạy dự án

### Yêu cầu hệ thống
- Node.js (v18.17 trở lên)
- MongoDB (chạy local trên port `27017` hoặc dùng MongoDB Atlas)

### Bước 1: Clone dự án và Cài đặt thư viện

```bash
git clone git@github.com:PhamNhatQuang207/Web-Pham.git
cd "Web gia phả"
npm install
```

### Bước 2: Thiết lập biến môi trường

Copy file template `.env.example` thành `.env.local` và điền thông tin phù hợp:

```bash
cp .env.example .env.local
```

Trong file `.env.local`:
```env
# URL kết nối MongoDB (Mặc định là localhost)
MONGODB_URI=mongodb://localhost:27017/gia-pha

# NextAuth config
NEXTAUTH_URL=http://localhost:3000
# Bạn có thể tạo SECRET ngẫu nhiên bằng lệnh: `openssl rand -base64 32`
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Thông tin chung của App
NEXT_PUBLIC_APP_NAME=Gia Phả Dòng Họ
```

### Bước 3: Chạy ứng dụng (Development)

```bash
npm run dev
```

Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000).

## 🗄 Cấu trúc Database (MongoDB)

- **`User`**: Tài khoản người dùng (bao gồm roles `ADMIN`, `EDITOR`, `VIEWER`).
- **`Member`**: Dữ liệu thành viên gia phả (liên kết qua `parentId` và `spouseId`).
- **`PendingRequest`**: Các đề xuất chỉnh sửa thông tin từ người dùng Viewer chờ Admin duyệt.

---
_Phát triển bởi PhamNhatQuang207_
