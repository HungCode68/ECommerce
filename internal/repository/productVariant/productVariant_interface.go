package productVariant

import (
	"golang/internal/model"
)

// ProductVariantsRepository - Interface định nghĩa các phương thức
type ProductVariantsRepository interface {
	CreateProductVariant(variant *model.ProductsVariants) (*model.ProductsVariants, error)
	GetProductVariantByID(productID int64) ([]model.ProductsVariants, error)
	GetVariantByID(variantID int64) (*model.ProductsVariants, error)
	UpdateProductVariant(variant *model.ProductsVariants) error
	DeleteProductVariant(variantID int64) error
}