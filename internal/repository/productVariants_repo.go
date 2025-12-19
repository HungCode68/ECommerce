package repository

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	"time"
)

type ProductVariantsRepository interface {
	CreateProductVariant(variant *model.ProductsVariants) (*model.ProductsVariants, error)
	GetProductVariantByID(productID int64) ([]model.ProductsVariants, error)
	GetVariantByID(variantID int64) (*model.ProductsVariants, error)
	UpdateProductVariant(variant *model.ProductsVariants) error
	DeleteProductVariant(variantID int64) error
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

func (provariant *VariantRepo) GetProductVariantByID(productID int64) ([]model.ProductsVariants, error) {
	rows, err := provariant.DB.Query(`
        SELECT id, product_id, sku, title, option_values, price_override, cost_price, 
               stock_quantity, allow_backorder, is_active, created_at, updated_at
        FROM product_variants 
        WHERE product_id = ?`, productID)
	if err != nil {
		return nil, fmt.Errorf("Cannot get product variants: %w", err)
	}
	defer rows.Close()
	var variants []model.ProductsVariants
	for rows.Next() {
		var v model.ProductsVariants
		err := rows.Scan(&v.ID, &v.ProductID, &v.SKU, &v.Title, &v.OptionValues,
			&v.PriceOverride, &v.CostPrice, &v.StockQuantity,
			&v.AllowBackorder, &v.IsActive, &v.CreatedAt, &v.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("Cannot scan variant: %w", err)
		}
		variants = append(variants, v)
	}
	return variants, nil
}

// UpdateProductVariant - Cập nhật thông tin variant
func (provariant *VariantRepo) UpdateProductVariant(variant *model.ProductsVariants) error {
	_, err := provariant.DB.Exec(`
		UPDATE product_variants 
		SET sku=?, title=?, option_values=?, price_override=?, cost_price=?, 
		    stock_quantity=?, allow_backorder=?, is_active=?, updated_at=NOW()
		WHERE id=?`,
		variant.SKU, variant.Title, variant.OptionValues, variant.PriceOverride,
		variant.CostPrice, variant.StockQuantity, variant.AllowBackorder,
		variant.IsActive, variant.ID)

	if err != nil {
		return fmt.Errorf("Cannot update product variant: %w", err)
	}

	return nil
}

// GetVariantByID - Lấy thông tin một variant theo ID
func (provariant *VariantRepo) GetVariantByID(variantID int64) (*model.ProductsVariants, error) {
	var v model.ProductsVariants
	err := provariant.DB.QueryRow(`
		SELECT id, product_id, sku, title, option_values, price_override, cost_price,
		       stock_quantity, allow_backorder, is_active, created_at, updated_at
		FROM product_variants
		WHERE id = ?`, variantID).Scan(
		&v.ID, &v.ProductID, &v.SKU, &v.Title, &v.OptionValues,
		&v.PriceOverride, &v.CostPrice, &v.StockQuantity,
		&v.AllowBackorder, &v.IsActive, &v.CreatedAt, &v.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("Variant not found")
		}
		return nil, fmt.Errorf("Cannot get variant: %w", err)
	}

	return &v, nil
}

// DeleteProductVariant - Xóa variant
func (provariant *VariantRepo) DeleteProductVariant(variantID int64) error {
	result, err := provariant.DB.Exec(`DELETE FROM product_variants WHERE id = ?`, variantID)
	if err != nil {
		return fmt.Errorf("Cannot delete product variant: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("Cannot check rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("Variant not found")
	}

	return nil
}
