package repository

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	"strings"
)

// ProductResponsitory - Interface định nghĩa các phương thức truy vấn dữ liệu sản phẩm
type ProductResponsitory interface {
	// CreateProduct - Tạo sản phẩm mới trong database
	CreateProduct(product *model.Product) (*model.Product, error)

	// GetConflictProductByName - Kiểm tra trùng lặp tên sản phẩm
	GetConflictProductByName(name string) (bool, error)

	// GetConflictProductBySlug - Kiểm tra trùng lặp slug sản phẩm
	GetConflictProductBySlug(slug string) (bool, error)

	// GetProductByID - Lấy sản phẩm theo ID (không bao gồm đã xóa mềm)
	GetProductByID(id int64) (*model.Product, error)

	// GetProductByName - Lấy sản phẩm theo tên (không bao gồm đã xóa mềm)
	GetProductByName(name string) (*model.Product, error)

	// GetProductBySlug - Lấy sản phẩm theo slug (không bao gồm đã xóa mềm)
	GetProductBySlug(slug string) (*model.Product, error)

	// GetManyProduct - Lấy nhiều sản phẩm theo danh sách IDs
	GetManyProduct(ids []int64) ([]model.Product, error)

	// GetAllProducts - Lấy tất cả sản phẩm (không bao gồm đã xóa mềm)
	GetAllProducts() ([]model.Product, error)

	// SearchProducts - Tìm kiếm sản phẩm theo tên (LIKE) hoặc thương hiệu (exact match)
	SearchProducts(req *model.SearchProductsRequest) ([]model.Product, error)

	// UpdateProduct - Cập nhật thông tin sản phẩm
	UpdateProduct(product *model.Product) (*model.Product, error)

	// DeleteSoftProduct - Xóa mềm sản phẩm (set deleted_at và status = 'archived')
	DeleteSoftProduct(id int64) error

	// BulkDeleteSoftProducts - Xóa mềm nhiều sản phẩm cùng lúc
	BulkDeleteSoftProducts(ids []int64) error

	// GetAllProductsSoftDeleted - Lấy tất cả sản phẩm đã xóa mềm
	GetAllProductsSoftDeleted() ([]model.Product, error)

	// DeleteAllProductsSoftDeleted - Xóa mềm tất cả sản phẩm đang active
	DeleteAllProductsSoftDeleted() error

	// DeleteAllProducts - Xóa vĩnh viễn tất cả sản phẩm (hard delete)
	DeleteAllProducts() error
}

// ProductRepo - Struct thực thi interface ProductResponsitory
type ProductRepo struct {
	DB *sql.DB
}

// NewProductRepo - Constructor tạo repository mới
func NewProductRepo(db *sql.DB) *ProductRepo {
	return &ProductRepo{DB: db}
}

func (pr *ProductRepo) CreateProduct(product *model.Product) (*model.Product, error) {
	result, err := pr.DB.Exec(`insert into products(name,slug,short_description,
								description,brand,status,
								is_published,published_at,
								min_price) values(?,?,?,?,?,?,?,?,?)`,
		product.Name,
		product.Slug, product.ShortDescription,
		product.Description, product.Brand,
		product.Status, product.IsPublished,
		product.PublishedAt, product.MinPrice)
	if err != nil {
		return nil, fmt.Errorf("Cannot create product")
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("Cannot get last insert id")
	}
	product.ID = id
	return product, nil
}

// Get product
func (pr *ProductRepo) GetProductByID(id int64) (*model.Product, error) {
	rows := pr.DB.QueryRow("Select id,name,slug,short_description,description,brand,status,is_published,published_at,min_price,avg_rating,rating_count,created_by,updated_by,created_at,updated_at,deleted_at from products where id=? and deleted_at IS NULL", id)
	var product model.Product
	err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &product, nil
}
func (pr *ProductRepo) GetProductByName(name string) (*model.Product, error) {
	rows := pr.DB.QueryRow("Select id,name,slug,short_description,description,brand,status,is_published,published_at,min_price,avg_rating,rating_count,created_by,updated_by,created_at,updated_at,deleted_at from products where name=? and deleted_at IS NULL", name)
	var product model.Product
	err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &product, nil
}
func (pr *ProductRepo) GetProductBySlug(slug string) (*model.Product, error) {
	rows := pr.DB.QueryRow("Select id,name,slug,short_description,description,brand,status,is_published,published_at,min_price,avg_rating,rating_count,created_by,updated_by,created_at,updated_at,deleted_at from products where slug=? and deleted_at IS NULL", slug)
	var product model.Product
	err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (pr *ProductRepo) GetManyProduct(ids []int64) ([]model.Product, error) {
	if len(ids) == 0 {
		return []model.Product{}, nil
	}


	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]

	query := fmt.Sprintf(`
        SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at 
        FROM products 
        WHERE id IN (%s) AND deleted_at IS NULL`, placeholders) // <-- ĐÃ SỬA


	params := make([]interface{}, len(ids))
	for i, id := range ids {
		params[i] = id
	}

	rows, err := pr.DB.Query(query, params...)
	if err != nil {
		return nil, fmt.Errorf("error querying multiple products: %w", err)
	}
	defer rows.Close()

	products := []model.Product{}
	for rows.Next() {
		var product model.Product
		err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}

// SearchProducts - Tìm kiếm sản phẩm theo tên,brand
func (pr *ProductRepo) SearchProducts(req *model.SearchProductsRequest) ([]model.Product, error) {
	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}

	if req.Search != "" {
		whereClause += " AND name LIKE ?"
		args = append(args, "%"+req.Search+"%")
	}


	if req.Brand != "" {
		whereClause += " AND brand = ?"
		args = append(args, req.Brand)
	}

	query := fmt.Sprintf(`
		SELECT id, name, slug, short_description, description, brand, 
		       status, is_published, published_at, min_price, 
		       avg_rating, rating_count, created_by, updated_by,
		       created_at, updated_at, deleted_at
		FROM products
		%s
		ORDER BY created_at DESC
	`, whereClause)

	rows, err := pr.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("error searching products: %w", err)
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var p model.Product
		err := rows.Scan(
			&p.ID, &p.Name, &p.Slug, &p.ShortDescription, &p.Description,
			&p.Brand, &p.Status, &p.IsPublished, &p.PublishedAt,
			&p.MinPrice, &p.AvgRating, &p.RatingCount,
			&p.CreatedBy, &p.UpdatedBy, &p.CreatedAt, &p.UpdatedAt, &p.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning product: %w", err)
		}
		products = append(products, p)
	}

	return products, nil
}

func (pr *ProductRepo) GetConflictProductByName(name string) (bool, error) {
	var id int64
	err := pr.DB.QueryRow("SELECT id FROM products WHERE name = ?", name).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil 
		}
		return false, err 
	}
	return true, nil
}

func (pr *ProductRepo) GetConflictProductBySlug(slug string) (bool, error) {
	var id int64
	err := pr.DB.QueryRow("SELECT id FROM products where slug=?", slug).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil // No conflict
		}
		return false, err // Some other error
	}
	return true, nil
}

func (pr *ProductRepo) UpdateProduct(product *model.Product) (*model.Product, error) {
	_, err := pr.DB.Exec(`UPDATE products SET name=?, slug=?, short_description=?,
							description=?, brand=?, status=?,is_published=?,published_at=?,
							min_price=? where id=?`,
		product.Name,
		product.Slug, product.ShortDescription, product.Description,
		product.Brand, product.Status, product.IsPublished,
		product.PublishedAt, product.MinPrice, product.ID)
	if err != nil {
		return nil, fmt.Errorf("Cannot update product: %w", err)
	}
	return product, nil

}

func (pr *ProductRepo) GetAllProducts() ([]model.Product, error) {
	rows, err := pr.DB.Query("SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at FROM products ")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []model.Product{}
	for rows.Next() {
		var product model.Product
		if err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt); err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}
func (pr *ProductRepo) DeleteSoftProduct(id int64) error {
	_, err := pr.DB.Exec("UPDATE products SET deleted_at = CURRENT_TIMESTAMP , status = 'archived' WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("Cannot soft delete product: %w", err)
	}
	return nil
}

// BulkDeleteSoftProducts - Xóa mềm nhiều sản phẩm cùng lúc
func (pr *ProductRepo) BulkDeleteSoftProducts(ids []int64) error {
	if len(ids) == 0 {
		return nil
	}

	// Tạo placeholders cho IN clause
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]

	query := fmt.Sprintf(`
		UPDATE products 
		SET deleted_at = CURRENT_TIMESTAMP, status = 'archived'
		WHERE id IN (%s) AND deleted_at IS NULL
	`, placeholders)

	// Chuẩn bị params
	params := make([]interface{}, len(ids))
	for i, id := range ids {
		params[i] = id
	}

	result, err := pr.DB.Exec(query, params...)
	if err != nil {
		return fmt.Errorf("cannot bulk soft delete products: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no products found to delete")
	}

	return nil
}

func (pr *ProductRepo) GetAllProductsSoftDeleted() ([]model.Product, error) {
	rows, err := pr.DB.Query("SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at FROM products where status='archived' AND deleted_at IS NOT NULL")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	products := []model.Product{}
	for rows.Next() {
		var product model.Product
		if err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt); err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}

func (pr *ProductRepo) DeleteAllProductsSoftDeleted() error {
	_, err := pr.DB.Exec("UPDATE products SET deleted_at = CURRENT_TIMESTAMP, status = 'archived' WHERE status='active' AND deleted_at IS  NULL")
	if err != nil {
		return fmt.Errorf("Cannot delete all soft deleted products: %w", err)
	}
	return nil
}

func (pr *ProductRepo) DeleteAllProducts() error {
	_, err := pr.DB.Exec("DELETE FROM products")
	if err != nil {
		return fmt.Errorf("Cannot delete all products: %w", err)
	}
	return nil
}
