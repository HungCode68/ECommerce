# Kế hoạch tích hợp HTML5 Geolocation

## Mục tiêu

Thêm tính năng `Lấy vị trí hiện tại` cho web bằng HTML5 Geolocation để hỗ trợ điền địa chỉ giao hàng nhanh hơn.

## Hướng triển khai chuẩn

1. Frontend hiển thị nút `Lấy vị trí hiện tại`.
2. Khi người dùng bấm nút, trình duyệt gọi `navigator.geolocation.getCurrentPosition`.
3. Nếu lấy được tọa độ, frontend nhận `latitude` và `longitude`.
4. Frontend hoặc backend gọi reverse geocoding để đổi tọa độ thành địa chỉ gần đúng.
5. Đổ dữ liệu vào form địa chỉ.
6. Người dùng kiểm tra và chỉnh sửa tay nếu cần.
7. Khi submit, hệ thống lưu địa chỉ như bình thường.

## Vì sao chọn HTML5 Geolocation

- Không cần cài thêm thư viện để lấy vị trí.
- Độ chính xác cao hơn nhiều so với định vị theo IP.
- Phù hợp cho form địa chỉ giao hàng và checkout.

## Ưu điểm

- Chính xác cao, nhất là trên điện thoại.
- Có thể lấy trực tiếp từ GPS, Wi-Fi, mạng di động.
- Tích hợp sẵn trong trình duyệt hiện đại.

## Nhược điểm

- Trình duyệt sẽ hỏi quyền truy cập vị trí.
- Nếu người dùng từ chối thì không lấy được vị trí.
- Production thường phải chạy bằng `https`.

## Luồng hoạt động

### Luồng thành công

1. Người dùng bấm `Lấy vị trí hiện tại`.
2. Trình duyệt hiện popup xin quyền.
3. Người dùng chọn `Cho phép`.
4. Frontend lấy được `latitude` và `longitude`.
5. Hệ thống gọi reverse geocoding.
6. Nhận về địa chỉ gần đúng:
   - tỉnh/thành
   - quận/huyện
   - phường/xã
   - địa chỉ mô tả gần đúng
7. Form được tự điền.
8. Người dùng kiểm tra lại và bấm lưu.

### Luồng từ chối quyền

1. Người dùng bấm `Lấy vị trí hiện tại`.
2. Trình duyệt hiện popup xin quyền.
3. Người dùng chọn `Từ chối`.
4. Frontend hiển thị thông báo:
   `Bạn cần cấp quyền vị trí để dùng tính năng này.`
5. Người dùng nhập địa chỉ thủ công.

### Luồng lỗi thiết bị hoặc timeout

1. Người dùng đã cho phép quyền.
2. Thiết bị không lấy được vị trí hoặc mất quá nhiều thời gian.
3. Frontend hiển thị lỗi:
   - `Không thể xác định vị trí hiện tại`
   - hoặc `Hết thời gian lấy vị trí`
4. Fallback sang nhập địa chỉ tay.

## Cơ chế hoạt động

### 1. Lấy tọa độ trên frontend

Frontend dùng:

```ts
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords
  },
  (error) => {
    console.error(error)
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
)
```

### 2. Reverse geocoding

Sau khi có `lat/lng`, hệ thống cần đổi sang địa chỉ dễ đọc.

Có 2 cách:

- Gọi trực tiếp từ frontend
- Gọi qua backend rồi backend gọi dịch vụ geocoding

Khuyến nghị:

- Nếu có API key hoặc muốn kiểm soát tốt hơn, gọi qua backend
- Nếu muốn làm nhanh bản đầu, có thể gọi từ frontend

### 3. Đổ vào form địa chỉ

Sau khi có dữ liệu địa chỉ:

- tự điền các ô trong form
- vẫn cho người dùng sửa tay
- không tự submit ngay

## State nên có ở frontend

- `idle`: chưa làm gì
- `requesting_permission`: đang chờ user cấp quyền
- `locating`: đang lấy tọa độ
- `resolving_address`: đang đổi tọa độ sang địa chỉ
- `success`: lấy thành công
- `error`: có lỗi

## Cơ chế fallback

Luôn phải có fallback nhập tay.

Không được phụ thuộc hoàn toàn vào geolocation vì:

- user có thể từ chối quyền
- thiết bị có thể không hỗ trợ
- GPS có thể sai hoặc timeout

## Trường hợp cần xử lý

### Trình duyệt không hỗ trợ

Hiển thị:

`Trình duyệt không hỗ trợ định vị.`

### User từ chối quyền

Hiển thị:

`Bạn chưa cấp quyền truy cập vị trí.`

### Thiết bị không xác định được vị trí

Hiển thị:

`Không thể xác định vị trí hiện tại.`

### Timeout

Hiển thị:

`Không thể lấy vị trí trong thời gian cho phép.`

## Khuyến nghị UI/UX

- Chỉ xin quyền khi user bấm nút
- Không xin quyền ngay khi mở trang
- Hiển thị loading rõ ràng:
  - `Đang lấy vị trí...`
  - `Đang xác định địa chỉ...`
- Sau khi fill địa chỉ, báo:
  - `Đã điền vị trí gần đúng, vui lòng kiểm tra lại`

## Gợi ý tích hợp vào repo này

Các vị trí hợp lý:

- trang quản lý địa chỉ
- trang checkout

## Luồng triển khai thực tế trong repo

1. Thêm nút `Lấy vị trí hiện tại` vào form địa chỉ.
2. Tạo helper lấy geolocation ở frontend.
3. Tạo service reverse geocoding.
4. Fill dữ liệu vào form.
5. Người dùng chỉnh lại nếu cần.
6. Submit về backend như địa chỉ bình thường.

## Nếu cần backend

Backend chỉ cần khi bạn muốn:

- lưu thêm `latitude`, `longitude`
- reverse geocoding ở server
- che API key geocoding
- log hoặc kiểm soát request tốt hơn

## Kết luận

Giải pháp nên dùng là:

- HTML5 Geolocation ở frontend
- reverse geocoding sau khi lấy tọa độ
- luôn có fallback nhập địa chỉ thủ công

Đây là hướng đúng nhất cho web nếu mục tiêu là hỗ trợ điền địa chỉ giao hàng nhanh và chính xác.
