package productvariant

import "golang/internal/model"

// ProductVariantController - Interface định nghĩa nghiệp vụ biến thể
type ProductVariantController interface {
	// tạo mới biến thể cho sản phẩm
	CreateVariant(req model.CreateVariantRequest, productID int64) (*model.CreateVariantResponse, error)
	// Cập nhật biến thể sản phẩm
	UpdateVariant(req model.UpdateVariantRequest, variantID int64, productID int64) (*model.UpdateVariantResponse, error)
	// Xóa biến thể sản phẩm
	DeleteVariant(variantID int64, productID int64) (*model.DeleteVariantResponse, error)
}