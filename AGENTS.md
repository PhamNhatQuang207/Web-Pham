<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 📋 MASTER PROMPT: PHÁT TRIỂN DỰ ÁN WEB GIA PHẢ

## 1. Tổng quan dự án & Vai trò

- **Mục tiêu:** Xây dựng một ứng dụng web quản lý và hiển thị gia phả dòng họ.
- **Đối tượng sử dụng:** Thành viên trong dòng họ — bao gồm người cao tuổi (cần giao diện thân thiện) và thanh niên (ưu tiên mobile).
- **Tech Stack:** `Next.js` (App Router), `React`, `MongoDB`, `Tailwind CSS`.
- **Xác thực:** `NextAuth.js` sử dụng JWT.

## 2. Cấu trúc dữ liệu (MongoDB Schema)

Thiết kế các collection chính:

- **`Users`**
	- `id`, `name`, `email`, `password` (hashed), `role` (`"ADMIN"`, `"EDITOR"`, `"VIEWER"`)

- **`Members`**
	- Thông tin cơ bản: `name`, `birthDate`, `deathDate`, `gender`, `address`, `job`
	- Quan hệ: `parentId`, `spouseId`
	- Tư liệu: `bio`, `images` (array of URLs), `culturalInfo` (tên Hán‑Nôm, vai vế)

- **`PendingRequests`**
	- Lưu trữ các đóng góp/chỉnh sửa từ `VIEWER` chờ `ADMIN` duyệt

## 3. Lộ trình triển khai (Phát triển theo từng giai đoạn)

- **Giai đoạn 1 — Nền tảng & Xác thực (Auth)**
	- Thiết lập `Next.js` project với `Tailwind CSS`.
	- Cài đặt `NextAuth.js` sử dụng JWT (lưu session và role).
	- Tạo middleware bảo vệ các route nhạy cảm (ví dụ: `/admin`, `/edit`).
	- Chỉ cho phép `EDITOR` hoặc `ADMIN` truy cập các API `POST/PUT/DELETE` liên quan đến `Members`.

- **Giai đoạn 2 — Tính năng cốt lõi (Core Features)**
	- Trực quan hóa cây gia phả (gợi ý: `react-flow` hoặc `d3.js`).
	- Tính năng: zoom, drag-and-drop, click để xem hồ sơ thành viên.
	- Hồ sơ thành viên: trang chi tiết hiển thị đầy đủ thông tin, ảnh, và các mốc lịch sử.
	- Tìm kiếm: theo tên, thế hệ, hoặc địa danh (quê quán).

- **Giai đoạn 3 — Phân quyền & Cộng tác**
	- Giao diện Admin: dashboard quản lý danh sách thành viên và yêu cầu chỉnh sửa.
	- Form đóng góp: cho `VIEWER` gửi ảnh hoặc đề xuất đính chính.
	- Xử lý ngày tháng: tích hợp hiển thị lịch Âm cho ngày giỗ/ngày sinh truyền thống.

- **Giai đoạn 4 — UI/UX & Mobile Optimization**
	- Thiết kế adaptive: chữ lớn, tương phản tốt cho người già; layout tối ưu cho điện thoại.
	- Bảo mật: ẩn thông tin nhạy cảm của người còn sống (địa chỉ chính xác, số điện thoại) đối với khách không đăng nhập.

## 4. Yêu cầu kỹ thuật đối với AI Agent

- **Code Style:** Viết component theo dạng functional components, dùng TypeScript để định nghĩa schema.
- **API Design:** Sử dụng Next.js API Routes hoặc Server Actions; mọi API thay đổi dữ liệu phải kiểm tra quyền từ JWT session.
- **Security:** Đảm bảo dữ liệu nhạy cảm được bảo vệ theo chính sách quyền riêng tư.
