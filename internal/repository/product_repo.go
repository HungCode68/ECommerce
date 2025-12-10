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
	rows := pr.DB.QueryRow("Select id,name,slug,short_description,description,brand,status,is_published,published_at,min_price,avg_rating,rating_count,created_by,updated_by,created_at,updated_at,deleted_at from products where id=?", id)
	var product model.Product
	err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &product, nil
}
func (pr *ProductRepo) GetProductByName(name string) (*model.Product,error){
	rows := pr.DB.QueryRow("Select id,name,slug,short_description,description,brand,status,is_published,published_at,min_price,avg_rating,rating_count,created_by,updated_by,created_at,updated_at,deleted_at from products where name=?", name)
	var product model.Product
	err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &product, nil
}
func (pr *ProductRepo) GetProductBySlug(slug string) (*model.Product,error){
	rows := pr.DB.QueryRow("Select id,name,slug,short_description,description,brand,status,is_published,published_at,min_price,avg_rating,rating_count,created_by,updated_by,created_at,updated_at,deleted_at from products where slug=?", slug)
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
	query := "SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at FROM products WHERE id IN ("
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
