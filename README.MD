# ECommerce Backend (Go + MySQL)

Project backend e-commerce viết bằng Go, sử dụng kiến trúc nhiều tầng:

- Handler -> Controller -> Repository
- HTTP server dùng `net/http` + `ServeMux`
- Database dùng MySQL
- Auth dùng JWT
- Cron job dùng robfig/cron

## 1. Yêu cầu môi trường

- Go 1.25+
- Node.js (phiên bản mới nhất)
- MySQL 8+

## 2. Hướng dẫn cài đặt cho người mới (Setup Guide)

**Bước 1: Clone code về máy và tải thư viện**
```bash
git clone https://github.com/HungCode68/ECommerce.git
cd ECommerce

# 1. Cài đặt thư viện Frontend
npm install

# 2. Tải thư viện Backend
go mod download
```

**Bước 2: Cài đặt Cơ sở dữ liệu**
1. Mở MySQL (ví dụ qua XAMPP hoặc MySQL Workbench).
2. Tạo một database rỗng tên là `ecommerce`.
3. Chạy file `schemal.sql` để tạo toàn bộ cấu trúc bảng.
4. Chạy file `dump.sql` (nếu có xin từ chủ project) để có sẵn dữ liệu mẫu.

**Bước 3: Cấu hình biến môi trường**
1. Tìm file `.env.example` ở ngoài cùng thư mục dự án.
2. Copy nó và đổi tên file mới thành `.env`.
3. Mở file `.env` lên, điền mật khẩu MySQL của bạn vào mục `DB_PASSWORD_MYSQL`.

**Bước 4: Chạy dự án**
Mở 2 cửa sổ terminal riêng biệt:
- Terminal 1 (Chạy Frontend): `npm run dev` (truy cập `http://localhost:5173`)
- Terminal 2 (Chạy Backend): `go run cmd/app/main.go`

## 3. Cấu trúc chính

- `cmd/app/main.go`: entrypoint chạy server
- `internal/module`: khởi tạo dependency cho từng module
- `internal/router`: khai báo route
- `internal/handler`: nhận request/response
- `internal/controller`: xử lý business logic
- `internal/repository`: truy cập database
- `internal/cron`: cron manager cho tác vụ định kỳ
- `docs/`: swagger/yaml tài liệu API theo module

## 3. Biến môi trường (.env)

Tạo file `.env` ở root project:

```env
DB_USER_MYSQL=root
DB_PASSWORD_MYSQL=your_password
DB_HOST_MYSQL=127.0.0.1
DB_PORT_MYSQL=3306
DB_NAME=ecommerce
DB_PARAMS=parseTime=true&loc=Local

JWT_SECRET=replace_with_a_secret_of_at_least_32_chars
GOOGLE_CLIENT_ID=your_google_web_client_id
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=yourmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM=yourmail@gmail.com

# Optional tuning
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME_MINS=5
DB_CONN_MAX_IDLE_TIME_MINS=2
```

## 4. Cài dependencies

```bash
go mod tidy
```

## 5. Chạy project

```bash
go run cmd/app/main.go
```

Server mặc định chạy tại:

- `http://localhost:8081`

Health check:

- `GET /health`

## 6. Kiểm tra build

```bash
go build ./...
```

## 7. Cron job

Cron được khởi tạo trong stats module và start ở `main`.

Lịch chạy hiện tại:

- `30 0 * * *` (00:30 mỗi ngày): sync thống kê doanh thu/ngày.

## 8. Route map nhanh

Luu y: project hiện có 2 style prefix route (`/api/...` và `/admin|/user/...`).

### Auth + User

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/email-verification/send`
- `POST /api/auth/email-verification/verify`
- `POST /api/auth/refresh`
- `POST /api/auth/logout` (auth)
- `PUT /api/users/me` (auth)
- `DELETE /api/users/me` (auth)
- `GET /api/admin/users` (admin)
- `GET /api/admin/users/search` (admin)
- `GET /api/admin/users/{id}` (admin)
- `POST /api/admin/users` (admin)
- `PUT /api/admin/users/{id}` (admin)
- `DELETE /api/admin/users` (admin)

### Address

- `POST /api/addresses` (auth)
- `GET /api/addresses` (auth)
- `GET /api/addresses/{id}` (auth)
- `PUT /api/addresses/{id}` (auth)
- `DELETE /api/addresses/{id}` (auth)
- `PUT /api/addresses/{id}/default` (auth)

### Category

- `GET /api/categories`
- `GET /api/categories/search`
- `GET /api/admin/categories` (admin)
- `GET /api/admin/categories/search` (admin)
- `POST /api/admin/categories` (admin)
- `GET /api/admin/categories/{id}` (admin)
- `PUT /api/admin/categories/{id}` (admin)
- `DELETE /api/admin/categories` (admin)
- `DELETE /api/admin/categories/hard/{id}` (admin)

### Cart

- `GET /api/cart` (auth)
- `POST /api/cart` (auth)
- `PUT /api/cart/items/{id}` (auth)
- `DELETE /api/cart/items` (auth)
- `POST /api/cart/checkout-preview` (auth)

### Order

- `POST /api/orders` (auth)
- `GET /api/orders` (auth)
- `GET /api/orders/{id}` (auth)
- `POST /api/orders/{id}/cancel` (auth)
- `GET /api/admin/orders` (admin)
- `GET /api/admin/orders/{id}` (admin)
- `PUT /api/admin/orders/{id}/status` (admin)
- `POST /api/admin/orders/{id}/confirm-payment` (admin)

### Product / Variant / Review / History

- Product admin dùng prefix `/api/admin/...`, public/auth user dùng `/api/...`.
- Variant admin: `/api/admin/product/{id}/variant...`
- Review: `GET /api/product/{id}/reviews`, `POST /api/product/{id}/reviews` (auth), admin delete tại `/api/admin/product/reviews/{reviewId}`.
- History admin: `/api/admin/product/history` và `/api/admin/product/history/all`.

### Stats (Admin)

- `GET /api/admin/stats/dashboard`
- `GET /api/admin/stats/top-products`
- `GET /api/admin/stats/products/{id}`
- `POST /api/admin/stats/sync`

## 9. API docs YAML

Các file yaml đang nằm trong thư mục `docs/`:

- `address_api_doc.yaml`
- `categories_api_doc.yaml`
- `order_api_doc.yaml`
- `product.yaml`
- `producthistory_doc.yaml`
- `productReview_api_doc.yaml`
- `productVariants_api_doc.yaml`
- `stats_api_doc.yaml`
- `user_api_doc.yaml`
- `cart_api_doc.yaml`

## 10. Ghi chú vận hành

- `JWT_SECRET` bat buoc phai co va nen >= 32 ky tu.
- Project da co graceful shutdown trong `main`.
- Route cua module Product/Variant/Review/History da duoc chuan hoa sang `/api/...`.

## 11. Ton dong ky thuat can sua dan

Danh sach duoi day duoc sap xep theo muc do uu tien de sua theo tung dot.

### Dot 1 (Bao mat/Auth - uu tien cao)

- [ ] Sua claim `Subject` cua refresh token dang tao sai kieu chuyen doi
	- Vi tri: [internal/controller/user/user_controller.go](internal/controller/user/user_controller.go#L371)
	- Hien tai dang dung `string(rune(userID))`, can doi sang chuoi so dung nghia.

- [ ] Verify refresh token JWT truoc khi cap token moi
	- Vi tri: [internal/controller/user/user_controller.go](internal/controller/user/user_controller.go#L387)
	- Hien tai chu yeu doi chieu token trong DB, chua parse/verify claims cryptographically.

- [ ] Chuan hoa response loi, tranh tra noi dung noi bo ra client
	- Vi tri mau:
		- [internal/handler/category/category_handler.go](internal/handler/category/category_handler.go#L49)
		- [internal/handler/user/user_handler.go](internal/handler/user/user_handler.go#L121)
		- [internal/handler/cart/cart_handler.go](internal/handler/cart/cart_handler.go#L72)
	- Muc tieu: log chi tiet o server, response ra client chi de message an toan.

### Dot 2 (On dinh van hanh)

- [ ] Them timeout/cancel cho cron sync stats
	- Vi tri: [internal/cron/cron.go](internal/cron/cron.go#L31)
	- Hien tai dang dung `context.Background()` khong co deadline.

- [ ] Loai bo viec dong DB trung lap trong `main`
	- Vi tri:
		- [cmd/app/main.go](cmd/app/main.go#L24)
		- [cmd/app/main.go](cmd/app/main.go#L78)
	- Muc tieu: giu 1 luong dong connection nhat quan.

### Dot 3 (Kha nang maintain va mo rong)

- [ ] Chuan hoa route prefix toan he thong
- Da chuan hoa cho cum Product/Variant/Review/History.
- Cac module khac dang su dung `/api/...`.
	- Muc tieu: thong nhat convention de client/API mapping de dang hon.

- [ ] Bo sung test tu dong cho luong quan trong
	- Trang thai hien tai: chua co file test (`*_test.go`).
	- Uu tien test: auth/login-refresh, create order, update order status, cart checkout preview.

- [ ] Bo sung migration SQL versioned ro rang
	- Muc tieu: dong bo schema giua local/staging/prod, tranh lech DB.

### De xuat thu tu sua nhanh

1. Hoan tat Dot 1 truoc khi mo rong them feature.
2. Lam Dot 2 de giam rui ro runtime production.
3. Sau do moi chuan hoa Dot 3 de de maintain lau dai.
