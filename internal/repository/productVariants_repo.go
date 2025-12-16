package repository

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	"time"
)

type ProductVariantsRepository interface {
	CreateProductVariant(variant *model.ProductsVariants) (*model.ProductsVariants, error)
}

type VariantRepo struct {
	DB *sql.DB
}

func NewVariantRepo(db *sql.DB) *VariantRepo {
	return &VariantRepo{DB: db}
}

func (provariant *VariantRepo) CreateProductVariant(variant *model.ProductsVariants) (*model.ProductsVariants, error) {
	query, err := provariant.DB.Exec(`insert into product_variants (product_id,sku,title,option_values,price_override,cost_price,stock_quantity,allow_backorder,is_active) values(?,?,?,?,?,?,?,?,?)`,
		variant.ProductID, variant.SKU, variant.Title, variant.OptionValues, variant.PriceOverride, variant.CostPrice, variant.StockQuantity, variant.AllowBackorder, variant.IsActive)
	if err != nil {
		return nil, fmt.Errorf("Cannot create product variant: %v", err)
	}
	id, err := query.LastInsertId()
	if err != nil {
		return nil, err
	}
	variant.ID = id
	variant.CreatedAt = time.Now()
	return variant, nil
}
