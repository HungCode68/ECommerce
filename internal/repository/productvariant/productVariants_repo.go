package productvariant

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	"time"
)

type VariantRepo struct {
	DB *sql.DB
}

func NewVariantRepo(db *sql.DB) ProductVariantsRepository {
	return &VariantRepo{DB: db}
}

// CreateProductVariant - Tạo biến thể mới trong database
func (provariant *VariantRepo) CreateProductVariant(variant *model.ProductsVariants) (*model.ProductsVariants, error) {
	query, err := provariant.DB.Exec(`insert into product_variants (product_id,sku,title,option_values,price_override,cost_price,stock_quantity,allow_backorder,is_active,thumbnail_url) values(?,?,?,?,?,?,?,?,?,?)`,
		variant.ProductID, variant.SKU, variant.Title, variant.OptionValues, variant.PriceOverride, variant.CostPrice, variant.StockQuantity, variant.AllowBackorder, variant.IsActive, variant.ThumbnailURL)
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

// GetProductVariantByID - Lấy tất cả biến thể của một sản phẩm
func (provariant *VariantRepo) GetProductVariantByID(productID int64) ([]model.ProductsVariants, error) {
	rows, err := provariant.DB.Query(`
        SELECT id, product_id, sku, title, option_values, price_override, cost_price, 
               stock_quantity, allow_backorder, is_active, thumbnail_url, created_at, updated_at
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
			&v.AllowBackorder, &v.IsActive, &v.ThumbnailURL, &v.CreatedAt, &v.UpdatedAt)
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
		    stock_quantity=?, allow_backorder=?, is_active=?, thumbnail_url=?, updated_at=NOW()
		WHERE id=?`,
		variant.SKU, variant.Title, variant.OptionValues, variant.PriceOverride,
		variant.CostPrice, variant.StockQuantity, variant.AllowBackorder,
		variant.IsActive, variant.ThumbnailURL, variant.ID)

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
		       stock_quantity, allow_backorder, is_active, thumbnail_url, created_at, updated_at
		FROM product_variants
		WHERE id = ?`, variantID).Scan(
		&v.ID, &v.ProductID, &v.SKU, &v.Title, &v.OptionValues,
		&v.PriceOverride, &v.CostPrice, &v.StockQuantity,
		&v.AllowBackorder, &v.IsActive, &v.ThumbnailURL, &v.CreatedAt, &v.UpdatedAt)

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
	tx, err := provariant.DB.Begin()
	if err != nil {
		return fmt.Errorf("Cannot start transaction for deleting product variant: %w", err)
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.Exec(`DELETE FROM cart_items WHERE variant_id = ?`, variantID); err != nil {
		return fmt.Errorf("Cannot remove variant from carts: %w", err)
	}

	if _, err = tx.Exec(`UPDATE order_items SET variant_id = NULL WHERE variant_id = ?`, variantID); err != nil {
		return fmt.Errorf("Cannot detach variant from order items: %w", err)
	}

	if _, err = tx.Exec(`UPDATE product_history SET variant_id = NULL WHERE variant_id = ?`, variantID); err != nil {
		return fmt.Errorf("Cannot detach variant from product history: %w", err)
	}

	result, err := tx.Exec(`DELETE FROM product_variants WHERE id = ?`, variantID)
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

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("Cannot commit variant deletion: %w", err)
	}

	return nil
}

func (provariant *VariantRepo) GetVariantBySKU(sku string) (*model.ProductsVariants, error) {
	var v model.ProductsVariants
	err := provariant.DB.QueryRow(`
		SELECT id, product_id, sku, title, option_values, price_override, cost_price,
		       stock_quantity, allow_backorder, is_active, thumbnail_url, created_at, updated_at
		FROM product_variants
		WHERE sku = ?`, sku).Scan(
		&v.ID, &v.ProductID, &v.SKU, &v.Title, &v.OptionValues,
		&v.PriceOverride, &v.CostPrice, &v.StockQuantity,
		&v.AllowBackorder, &v.IsActive, &v.ThumbnailURL, &v.CreatedAt, &v.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Trả về nil nếu không tìm thấy (SKU hợp lệ để tạo mới)
		}
		return nil, fmt.Errorf("Cannot get variant: %w", err)
	}

	return &v, nil
}
