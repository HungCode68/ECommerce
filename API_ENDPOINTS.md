# 📋 API Endpoints - ECommerce System

> **Base URL:** `http://localhost:8081`  
> **Auth:** `Authorization: Bearer <token>` (JWT)

---

## 🔓 Public Endpoints (No Auth Required)

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh` | Refresh token |

### Products (Public)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/search` | Tìm kiếm sản phẩm |
| GET | `/api/product/search` | Tìm kiếm sản phẩm (alt) |
| GET | `/api/products/detail/search` | Tìm kiếm lấy thông tin chi tiết |
| GET | `/api/product/{id}/reviews` | Xem đánh giá sản phẩm |

### Categories (Public)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | Danh sách danh mục (Active) |
| GET | `/api/categories/search` | Tìm kiếm danh mục (Active) |

### Coupons (Public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/coupons/available` | Lấy danh sách coupon khả dụng |
| POST | `/api/coupons/validate` | Kiểm tra coupon hợp lệ |
| POST | `/api/coupons/apply` | Áp dụng coupon |

---

## 🔐 User Endpoints (Auth Required)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/logout` | Đăng xuất |

### User Profile
| Method | Path | Description |
|--------|------|-------------|
| PUT | `/api/users/me` | Cập nhật profile |
| DELETE | `/api/users/me` | Xóa tài khoản cá nhân |

### Addresses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/addresses` | Danh sách địa chỉ của tôi |
| POST | `/api/addresses` | Tạo địa chỉ mới |
| GET | `/api/addresses/{id}` | Xem chi tiết địa chỉ |
| PUT | `/api/addresses/{id}` | Cập nhật địa chỉ |
| DELETE | `/api/addresses/{id}` | Xóa địa chỉ |
| PUT | `/api/addresses/{id}/default` | Đặt địa chỉ mặc định |

### Cart
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cart` | Xem giỏ hàng |
| POST | `/api/cart` | Thêm vào giỏ hàng |
| PUT | `/api/cart/items/{id}` | Cập nhật số lượng item |
| DELETE | `/api/cart/items` | Xóa sản phẩm khỏi giỏ |
| POST | `/api/cart/checkout-preview` | Tính toán checkout (preview) |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Tạo đơn hàng |
| GET | `/api/orders` | Danh sách đơn hàng của tôi |
| GET | `/api/orders/{id}` | Chi tiết đơn hàng |
| POST | `/api/orders/{id}/cancel` | Hủy đơn hàng |

### Reviews
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/product/{id}/reviews` | Tạo đánh giá sản phẩm |

---

## 🛡️ Admin Endpoints (Admin Only)

### User Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | Lấy tất cả users |
| GET | `/api/admin/users/search` | Tìm kiếm users |
| GET | `/api/admin/users/{id}` | Lấy user theo ID |
| POST | `/api/admin/users` | Tạo mới admin |
| DELETE | `/api/admin/users` | Xóa nhiều users |
| PUT | `/api/admin/users/{id}` | Cập nhật user |

### Product Management
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/product` | Tạo mới sản phẩm |
| GET | `/api/admin/product/{id}` | Chi tiết sản phẩm |
| GET | `/api/admin/product/all` | Lấy tất cả (kể cả đã xóa mềm) |
| PUT | `/api/admin/product/update/{id}` | Cập nhật sản phẩm |
| GET | `/api/admin/product/search` | Tìm kiếm sản phẩm |
| POST | `/api/admin/products` | Lấy nhiều sản phẩm (Active) |
| POST | `/api/admin/products/import-csv` | Import sản phẩm từ CSV |
| GET | `/api/admin/products/deleted` | Lấy sản phẩm trong thùng rác |
| POST | `/api/admin/products/delesoft` | Xóa mềm nhiều sản phẩm |
| DELETE | `/api/admin/products/deleall` | Xóa cứng toàn bộ thùng rác |

### Product Variants
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/product/{id}/variant` | Tạo biến thể mới |
| PUT | `/api/admin/product/{id}/variant/{variantId}` | Cập nhật biến thể |
| DELETE | `/api/admin/product/{id}/variant/{variantId}` | Xóa biến thể |

### Product History
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/product/history` | Lịch sử thay đổi theo sản phẩm (`?product_id=`) |
| GET | `/api/admin/product/history/all` | Lịch sử thay đổi tất cả sản phẩm |

### Product Reviews (Admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/product/{id}/reviews` | Xem đánh giá sản phẩm |
| DELETE | `/api/admin/product/reviews/{reviewId}` | Xóa đánh giá |

### Category Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/categories` | Tất cả danh mục (kể cả ẩn) |
| GET | `/api/admin/categories/search` | Tìm kiếm danh mục (kể cả ẩn) |
| POST | `/api/admin/categories` | Tạo mới danh mục |
| DELETE | `/api/admin/categories` | Xóa mềm nhiều danh mục |
| GET | `/api/admin/categories/{id}` | Chi tiết danh mục |
| PUT | `/api/admin/categories/{id}` | Cập nhật danh mục |
| DELETE | `/api/admin/categories/hard/{id}` | Xóa cứng danh mục |

### Coupon Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/coupons` | Lấy tất cả coupons |
| POST | `/api/admin/coupons` | Tạo coupon mới |
| DELETE | `/api/admin/coupons` | Xóa nhiều coupons |
| GET | `/api/admin/coupons/{id}` | Chi tiết coupon |
| PUT | `/api/admin/coupons/{id}` | Cập nhật coupon |
| DELETE | `/api/admin/coupons/{id}` | Xóa coupon |

### Order Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/orders` | Tìm kiếm và lọc tất cả đơn hàng |
| GET | `/api/admin/orders/{id}` | Chi tiết đơn hàng (Full log) |
| PUT | `/api/admin/orders/{id}/status` | Cập nhật trạng thái đơn hàng |
| POST | `/api/admin/orders/{id}/confirm-payment` | Xác nhận thanh toán |

### Statistics & Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats/dashboard` | Dashboard Overview |
| GET | `/api/admin/stats/top-products` | Top sản phẩm bán chạy |
| GET | `/api/admin/stats/products/{id}` | Thống kê của 1 sản phẩm |
| POST | `/api/admin/stats/sync` | Sync dữ liệu thủ công |

---

## 📊 Summary

| Category | Public | User Auth | Admin |
|----------|--------|-----------|-------|
| Auth | 3 | 1 | - |
| Users | - | 2 | 6 |
| Products | 4 | - | 10 |
| Product Variants | - | - | 3 |
| Product History | - | - | 2 |
| Product Reviews | 1 | 1 | 2 |
| Categories | 2 | - | 7 |
| Cart | - | 5 | - |
| Coupons | 3 | - | 6 |
| Orders | - | 4 | 4 |
| Stats | - | - | 4 |
| System | 1 | - | - |
| **Total** | **14** | **13** | **44** |

> **Grand Total: 71 endpoints**

---

## 🚀 HTTP Requests (Copy & Paste vào Postman / .http file)

> **Variables:** Thay `{{token}}` bằng JWT token, `{{admin_token}}` bằng admin token.

---

### 🔓 Public

```http
### Health Check
GET http://localhost:8081/health

### Đăng ký
POST http://localhost:8081/api/auth/register
Content-Type: application/json

{
  "name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "password123"
}

### Đăng nhập
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

### Refresh Token
POST http://localhost:8081/api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token_here"
}

### Tìm kiếm sản phẩm
GET http://localhost:8081/api/products/search?q=ao&page=1&limit=10

### Tìm kiếm sản phẩm (alt)
GET http://localhost:8081/api/product/search?q=ao

### Tìm kiếm sản phẩm chi tiết
GET http://localhost:8081/api/products/detail/search?q=ao&page=1&limit=10

### Xem đánh giá sản phẩm
GET http://localhost:8081/api/product/1/reviews

### Danh sách danh mục
GET http://localhost:8081/api/categories

### Tìm kiếm danh mục
GET http://localhost:8081/api/categories/search?q=ao

### Lấy coupon khả dụng
POST http://localhost:8081/api/coupons/available
Content-Type: application/json

{
  "order_amount": 500000
}

### Kiểm tra coupon hợp lệ
POST http://localhost:8081/api/coupons/validate
Content-Type: application/json

{
  "code": "SUMMER10",
  "order_amount": 500000
}

### Áp dụng coupon
POST http://localhost:8081/api/coupons/apply
Content-Type: application/json

{
  "code": "SUMMER10",
  "order_amount": 500000
}
```

---

### 🔐 User (Auth Required)

```http
### Đăng xuất
POST http://localhost:8081/api/auth/logout
Authorization: Bearer {{token}}

### Cập nhật profile
PUT http://localhost:8081/api/users/me
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Nguyen Van B",
  "phone": "0912345678"
}

### Xóa tài khoản
DELETE http://localhost:8081/api/users/me
Authorization: Bearer {{token}}

### Danh sách địa chỉ
GET http://localhost:8081/api/addresses
Authorization: Bearer {{token}}

### Tạo địa chỉ mới
POST http://localhost:8081/api/addresses
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "receiver_name": "Nguyen Van A",
  "receiver_phone": "0912345678",
  "province": "Ha Noi",
  "district": "Cau Giay",
  "ward": "Dich Vong",
  "address_detail": "123 Duong ABC",
  "is_default": true
}

### Chi tiết địa chỉ
GET http://localhost:8081/api/addresses/1
Authorization: Bearer {{token}}

### Cập nhật địa chỉ
PUT http://localhost:8081/api/addresses/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "receiver_name": "Nguyen Van B",
  "receiver_phone": "0987654321",
  "address_detail": "456 Duong XYZ"
}

### Xóa địa chỉ
DELETE http://localhost:8081/api/addresses/1
Authorization: Bearer {{token}}

### Đặt địa chỉ mặc định
PUT http://localhost:8081/api/addresses/1/default
Authorization: Bearer {{token}}

### Xem giỏ hàng
GET http://localhost:8081/api/cart
Authorization: Bearer {{token}}

### Thêm vào giỏ hàng
POST http://localhost:8081/api/cart
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "product_id": 1,
  "variant_id": 1,
  "quantity": 2
}

### Cập nhật số lượng item
PUT http://localhost:8081/api/cart/items/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "quantity": 3
}

### Xóa item khỏi giỏ
DELETE http://localhost:8081/api/cart/items
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "item_ids": [1, 2]
}

### Preview checkout
POST http://localhost:8081/api/cart/checkout-preview
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "selected_variant_ids": [1, 2],
  "order_coupon_code": "SALE10",
  "shipping_coupon_code": "FREESHIP30"
}

### Tạo đơn hàng
POST http://localhost:8081/api/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "address_id": 1,
  "items": [
    {
      "product_id": 1,
      "variant_id": 1,
      "quantity": 2
    }
  ],
  "order_coupon_code": "SALE10",
  "shipping_coupon_code": "FREESHIP30",
  "payment_method": "cod",
  "note": "Giao gio hanh chinh"
}

### Danh sách đơn hàng của tôi
GET http://localhost:8081/api/orders?page=1&limit=10&status=pending
Authorization: Bearer {{token}}

### Chi tiết đơn hàng
GET http://localhost:8081/api/orders/1
Authorization: Bearer {{token}}

### Hủy đơn hàng
POST http://localhost:8081/api/orders/1/cancel
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "reason": "Dat nham san pham"
}

### Tạo đánh giá sản phẩm
POST http://localhost:8081/api/product/1/reviews
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "rating": 5,
  "comment": "San pham rat tot!"
}
```

---

### 🛡️ Admin (Admin Token Required)

```http
### Lấy tất cả users
GET http://localhost:8081/api/admin/users?page=1&limit=20
Authorization: Bearer {{admin_token}}

### Tìm kiếm users
GET http://localhost:8081/api/admin/users/search?q=nguyen
Authorization: Bearer {{admin_token}}

### Lấy user theo ID
GET http://localhost:8081/api/admin/users/1
Authorization: Bearer {{admin_token}}

### Tạo admin mới
POST http://localhost:8081/api/admin/users
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}

### Xóa nhiều users
DELETE http://localhost:8081/api/admin/users
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "ids": [2, 3]
}

### Cập nhật user
PUT http://localhost:8081/api/admin/users/1
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "active"
}

### Tạo sản phẩm mới
POST http://localhost:8081/api/admin/product
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Ao thun nam",
  "slug": "ao-thun-nam",
  "description": "Ao thun nam chat luong cao",
  "category_id": 1,
  "price": 299000,
  "stock": 100
}

### Chi tiết sản phẩm
GET http://localhost:8081/api/admin/product/1
Authorization: Bearer {{admin_token}}

### Lấy tất cả sản phẩm (kể cả đã xóa)
GET http://localhost:8081/api/admin/product/all?page=1&limit=20
Authorization: Bearer {{admin_token}}

### Cập nhật sản phẩm
PUT http://localhost:8081/api/admin/product/update/1
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Ao thun nam (updated)",
  "price": 350000
}

### Tìm kiếm sản phẩm (admin)
GET http://localhost:8081/api/admin/product/search?q=ao&page=1&limit=10
Authorization: Bearer {{admin_token}}

### Lấy nhiều sản phẩm (active)
POST http://localhost:8081/api/admin/products
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "page": 1,
  "limit": 20,
  "category_id": 1
}

### Import sản phẩm từ CSV
POST http://localhost:8081/api/admin/products/import-csv
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data; boundary=----Boundary

------Boundary
Content-Disposition: form-data; name="file"; filename="products.csv"
Content-Type: text/csv

name,slug,price,stock
Ao thun,ao-thun,100000,50
------Boundary--

### Sản phẩm trong thùng rác
GET http://localhost:8081/api/admin/products/deleted?page=1&limit=20
Authorization: Bearer {{admin_token}}

### Xóa mềm nhiều sản phẩm
POST http://localhost:8081/api/admin/products/delesoft
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "ids": [5, 6]
}

### Xóa cứng toàn bộ thùng rác
DELETE http://localhost:8081/api/admin/products/deleall
Authorization: Bearer {{admin_token}}

### Tạo biến thể sản phẩm
POST http://localhost:8081/api/admin/product/1/variant
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "size": "L",
  "color": "Den",
  "price": 299000,
  "stock": 50,
  "sku": "SKU-001-L-BLACK"
}

### Cập nhật biến thể
PUT http://localhost:8081/api/admin/product/1/variant/1
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "price": 320000,
  "stock": 30
}

### Xóa biến thể
DELETE http://localhost:8081/api/admin/product/1/variant/1
Authorization: Bearer {{admin_token}}

### Lịch sử thay đổi sản phẩm (theo ID)
GET http://localhost:8081/api/admin/product/history?product_id=1
Authorization: Bearer {{admin_token}}

### Lịch sử thay đổi tất cả sản phẩm
GET http://localhost:8081/api/admin/product/history/all?page=1&limit=20
Authorization: Bearer {{admin_token}}

### Xem đánh giá sản phẩm (admin)
GET http://localhost:8081/api/admin/product/1/reviews
Authorization: Bearer {{admin_token}}

### Xóa đánh giá
DELETE http://localhost:8081/api/admin/product/reviews/1
Authorization: Bearer {{admin_token}}

### Tất cả danh mục (kể cả ẩn)
GET http://localhost:8081/api/admin/categories?page=1&limit=20
Authorization: Bearer {{admin_token}}

### Tìm kiếm danh mục (admin)
GET http://localhost:8081/api/admin/categories/search?q=quan
Authorization: Bearer {{admin_token}}

### Tạo danh mục mới
POST http://localhost:8081/api/admin/categories
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Ao nam",
  "slug": "ao-nam",
  "description": "Danh muc ao nam",
  "parent_id": null
}

### Xóa mềm nhiều danh mục
DELETE http://localhost:8081/api/admin/categories
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "ids": [3, 4]
}

### Chi tiết danh mục
GET http://localhost:8081/api/admin/categories/1
Authorization: Bearer {{admin_token}}

### Cập nhật danh mục
PUT http://localhost:8081/api/admin/categories/1
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Ao nam (updated)",
  "description": "Mo ta moi"
}

### Xóa cứng danh mục
DELETE http://localhost:8081/api/admin/categories/hard/1
Authorization: Bearer {{admin_token}}

### Lấy tất cả coupons
GET http://localhost:8081/api/admin/coupons?page=1&limit=20
Authorization: Bearer {{admin_token}}

### Tạo coupon mới
POST http://localhost:8081/api/admin/coupons
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "code": "SUMMER20",
  "type": "percent",
  "value": 20,
  "min_order_amount": 300000,
  "max_usage": 100,
  "max_usage_per_user": 1,
  "expired_at": "2025-12-31T23:59:59Z"
}

### Xóa nhiều coupons
DELETE http://localhost:8081/api/admin/coupons
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "ids": [5, 6]
}

### Chi tiết coupon
GET http://localhost:8081/api/admin/coupons/1
Authorization: Bearer {{admin_token}}

### Cập nhật coupon
PUT http://localhost:8081/api/admin/coupons/1
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "value": 25,
  "max_usage": 200
}

### Xóa coupon
DELETE http://localhost:8081/api/admin/coupons/1
Authorization: Bearer {{admin_token}}

### Tất cả đơn hàng (admin)
GET http://localhost:8081/api/admin/orders?page=1&limit=20&status=pending
Authorization: Bearer {{admin_token}}

### Chi tiết đơn hàng (admin)
GET http://localhost:8081/api/admin/orders/1
Authorization: Bearer {{admin_token}}

### Cập nhật trạng thái đơn hàng
PUT http://localhost:8081/api/admin/orders/1/status
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "status": "shipping",
  "note": "Da ban giao cho don vi van chuyen"
}

### Xác nhận thanh toán
POST http://localhost:8081/api/admin/orders/1/confirm-payment
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "payment_method": "bank_transfer",
  "transaction_id": "TXN123456"
}

### Dashboard Overview
GET http://localhost:8081/api/admin/stats/dashboard
Authorization: Bearer {{admin_token}}

### Top sản phẩm bán chạy
GET http://localhost:8081/api/admin/stats/top-products?limit=10
Authorization: Bearer {{admin_token}}

### Thống kê sản phẩm
GET http://localhost:8081/api/admin/stats/products/1
Authorization: Bearer {{admin_token}}

### Sync dữ liệu thủ công
POST http://localhost:8081/api/admin/stats/sync
Authorization: Bearer {{admin_token}}
```

---

## 📝 Checkout Preview - Response mẫu

```json
{
  "code": 200,
  "message": "Tinh toan thanh cong",
  "data": {
    "total_price": 870000,
    "total_items": 3,
    "sub_total": 870000,
    "discount_amount": 80000,
    "order_discount": 50000,
    "shipping_fee": 30000,
    "shipping_discount": 30000,
    "total_payable": 820000,
    "order_coupon": {
      "coupon_id": 12,
      "code": "SALE10",
      "discount_amount": 50000,
      "message": "Áp dụng mã giảm giá thành công"
    },
    "shipping_coupon": {
      "coupon_id": 18,
      "code": "FREESHIP30",
      "discount_amount": 30000,
      "message": "Áp dụng mã giảm giá thành công"
    },
    "items": [
      {
        "item_id": 1,
        "product_id": 11,
        "product_name": "iPhone 14",
        "variant_id": 1,
        "variant_name": "128GB / Black",
        "price": 290000,
        "quantity": 3,
        "sub_total": 870000,
        "stock_check": true,
        "stock_quantity": 10
      }
    ]
  },
  "errors": null
}
```

> **Quy tắc phí ship:**
> - `sub_total >= 500000` → miễn phí ship
> - `sub_total < 500000` → phí ship cố định `30,000đ`
>
> **Quy tắc coupon:**
> - Tối đa 1 `order_coupon_code` cho tiền hàng
> - Tối đa 1 `shipping_coupon_code` cho phí ship
> - Nếu không truyền mã, hệ thống tự tìm mã tốt nhất khả dụng
