package router

import (
	"golang/internal/handler/productVariant"
	"golang/internal/middleware"
	"net/http"
)

// NewProductVariantRouter định nghĩa các route cho biến thể sản phẩm (Variant)
func NewProductVariantRouter(mux *http.ServeMux, h productVariant.ProductVariantHandler) http.Handler {

	variantGroup := newGroup(mux, "/admin/product", middleware.AdminOnlyMiddleware)

	// Tạo biến thể mới cho sản phẩm
	variantGroup.HandleFunc("POST", "/{id}/variant", h.CreateVariantHandler)

	// Cập nhật biến thể
	variantGroup.HandleFunc("PUT", "/{id}/variant/{variantId}", h.UpdateVariantHandler)

	// Xóa biến thể
	variantGroup.HandleFunc("DELETE", "/{id}/variant/{variantId}", h.DeleteVariantHandler)

	return mux
}
