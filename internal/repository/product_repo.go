package repository

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
)

type ProductResponsitory interface {
	CreateProduct(product *model.Product) (*model.Product, error)
	GetConflictProductByName(name string) (bool, error)
	GetConflictProductBySlug(slug string) (bool, error)
	GetProductByID(id int64) (*model.Product, error)
	GetProductByName(name string) (*model.Product, error)
	GetProductBySlug(slug string) (*model.Product, error)
	GetManyProduct(ids []int64) ([]model.Product, error)
	GetAllProducts() ([]model.Product, error)
	SearchProducts(req *model.SearchProductsRequest) ([]model.Product, error)
	UpdateProduct(product *model.Product) (*model.Product, error)
	DeleteSoftProduct(id int64) error
	GetAllProductsSoftDeleted() ([]model.Product, error)
	DeleteAllProductsSoftDeleted() error
}

type ProductRepo struct {
	DB *sql.DB
}

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
	query := "SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at FROM products WHERE id and deleted_at IS NULL IN ("
	params := make([]interface{}, len(ids))
	for i, id := range ids {
		query += "?,"
		params[i] = id
	}
	query = query[:len(query)-1] + ")"

	rows, err := pr.DB.Query(query, params...)
	if err != nil {
		return nil, err
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

	// Search by name (LIKE)
	if req.Search != "" {
		whereClause += " AND name LIKE ?"
		args = append(args, "%"+req.Search+"%")
	}

	// Filter by brand
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
			return false, nil // No conflict
		}
		return false, err // Some other error
	}
	return true, nil // Conflict found
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
	rows, err := pr.DB.Query("SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at FROM products where deleted_at IS NOT NULL")
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
	_, err := pr.DB.Exec("UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("Cannot soft delete product: %w", err)

	}
	return nil
}
func (pr *ProductRepo) GetAllProductsSoftDeleted() ([]model.Product, error) {
	rows, err := pr.DB.Query("SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at FROM products where deleted_at IS NOT NULL")
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
	_, err := pr.DB.Exec("DELETE FROM products WHERE deleted_at IS NOT NULL")
	if err != nil {
		return fmt.Errorf("Cannot delete all soft deleted products: %w", err)
	}
	return nil
}