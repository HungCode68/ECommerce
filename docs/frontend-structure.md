# Frontend Structure Guide

Tài liệu này mô tả cấu trúc front-end hiện tại sau khi mình dọn lại cây thư mục, để mày biết file nào là file chính, file nào là helper, và chỗ nào là legacy.

## Mình đã sửa gì

- Chuẩn hóa luồng admin dashboard về đúng cây `src/pages`, `src/components`, `src/api`, `src/utils`, `src/types`.
- Đưa admin layout về `src/components/layout/AdminLayout.tsx`.
- Đưa admin dashboard page về `src/pages/admin/DashboardPage.tsx`.
- Tách API thống kê dashboard ra `src/api/admin/adminStats.api.ts`.
- Tách helper hiển thị dashboard ra `src/utils/adminDashboard.ts`.
- Chuyển type của dashboard sang `src/types/adminStats.types.ts`.
- Cập nhật router ở `src/app/routes.tsx` để app chạy theo đường import mới.

## Folder Map

### `src/app`

Chỉ nên coi đây là lớp ghép ứng dụng.

- `src/app/routes.tsx`: định nghĩa toàn bộ route của app.
- Nếu sau này có provider, shell, hoặc bootstrap riêng thì để ở đây.

Không nên để logic feature, layout, hay API nghiệp vụ mới vào đây nữa.

### `src/pages`

Đây là nơi chứa page-level component.

- `src/pages/shop/*`: các trang public cho khách hàng.
- `src/pages/admin/*`: các trang admin.

Quy tắc:

- Mỗi file là một route page.
- Page chỉ nên ghép feature/components, không nên chứa logic API nặng.

### `src/features`

Đây là nơi chứa UI theo chức năng.

Ví dụ:

- `src/features/admin/products`: form, table, modal, history cho sản phẩm.
- `src/features/admin/dashboard`: các block con của dashboard như top products, stats, chart.
- `src/features/shop/products`: card, filter, component hiển thị sản phẩm.

Quy tắc:

- Feature component dùng lại trong nhiều page.
- Logic của một màn hình nên nằm ở đây nếu nó không phải route page.

### `src/components`

Nơi chứa component dùng chung.

- `src/components/layout`: layout shell cho shop/admin.
- `src/components/shared`: dialog, table skeleton, empty state, search input, pagination.
- `src/components/ui`: component UI nền tảng.

Quy tắc:

- Nếu component dùng ở nhiều feature/page thì để ở đây.
- Layout tổng cho app cũng để ở đây.

### `src/api`

Nơi chứa các client gọi HTTP theo domain.

- `src/api/product.api.ts`: API public product.
- `src/api/admin/adminProduct.api.ts`: API admin product.
- `src/api/admin/adminStats.api.ts`: API dashboard/thống kê admin.
- Các file khác tương tự cho cart, order, auth, review, category...

Quy tắc:

- Chỉ chứa gọi API và map response.
- Không để JSX hay logic render vào đây.

### `src/utils`

Nơi chứa helper thuần, không phụ thuộc UI.

- `src/utils/format.ts`: format số, tiền, ngày, text.
- `src/utils/productVariant.ts`: helper xử lý variant.
- `src/utils/numberInput.ts`: sanitize input số.
- `src/utils/adminDashboard.ts`: helper riêng cho dashboard admin như `formatCurrency`, `formatShortCurrency`, `getInitials`, `getAvatarColor`.

Quy tắc:

- Không chứa gọi API.
- Không chứa JSX.

### `src/types`

Nơi chứa type/interface dùng chung.

- `src/types/product.types.ts`
- `src/types/adminStats.types.ts`
- `src/types/api.types.ts`
- Các type theo domain khác.

Quy tắc:

- Chỉ chứa kiểu dữ liệu.
- Không chứa logic runtime.

### `src/lib`

Nơi chứa infra-level helper.

- `src/lib/axiosClient.ts`: axios client chuẩn của app.
- `src/lib/queryClient.ts`: react-query client.
- `src/lib/utils.ts`: helper nhỏ kiểu `cn`.
- `src/lib/queryKeys.ts`: key cache react-query.

Quy tắc:

- Dùng cho tầng hạ tầng dùng chung.
- Không nên nhét feature logic vào đây.

### `src/store`

State global.

- `src/store/authStore.ts`
- `src/store/cartStore.ts`

Quy tắc:

- Chỉ giữ state dùng xuyên app.
- Không nhét logic page vào store.

## File quan trọng đã được chuẩn hóa

- `src/components/layout/AdminLayout.tsx`: layout admin chính thức.
- `src/pages/admin/DashboardPage.tsx`: dashboard admin chính thức.
- `src/api/admin/adminStats.api.ts`: API dashboard chính thức.
- `src/utils/adminDashboard.ts`: helper dashboard chính thức.
- `src/types/adminStats.types.ts`: type dashboard chính thức.
- `src/app/routes.tsx`: router chính thức của app.

## Legacy notes

Một số file cũ trong `src/app/` vẫn có thể còn trên disk như bản cũ hoặc compatibility copy.

- `src/app/layouts/AdminLayout.tsx`
- `src/app/pages/admin/AdminDashboard.tsx`
- `src/app/lib/api.ts`
- `src/app/lib/axiosClient.ts`

Các file này không còn nằm trong đường import chính của app. Nếu muốn dọn sạch hoàn toàn legacy file, có thể làm tiếp một pass riêng để xóa nốt chúng sau khi chắc chắn không còn nơi nào import vào.

## Cách mở rộng đúng chuẩn

- Thêm route mới: tạo file trong `src/pages/...`, rồi khai báo route trong `src/app/routes.tsx`.
- Thêm component dùng lại: đặt vào `src/components/shared` hoặc `src/components/layout`.
- Thêm logic theo domain: đặt vào `src/features/<domain>/...`.
- Thêm API: đặt vào `src/api/<domain>/...`.
- Thêm helper: đặt vào `src/utils/...`.
- Thêm type: đặt vào `src/types/...`.

