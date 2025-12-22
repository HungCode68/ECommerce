package productVariant

import "net/http"

// ProductVariantHandler - Interface định nghĩa các hàm xử lý biến thể
type ProductVariantHandler interface {
	// Tạo biến thể mới cho sản phẩm
	CreateVariantHandler(w http.ResponseWriter, r *http.Request)
	// Cập nhật biến thể sản phẩm
	UpdateVariantHandler(w http.ResponseWriter, r *http.Request)
	// Xóa biến thể sản phẩm
	DeleteVariantHandler(w http.ResponseWriter, r *http.Request)
}