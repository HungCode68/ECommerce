package product

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	"strings"
)

// ProductRepo - Struct thực thi interface ProductRepository
type ProductRepo struct {
	DB *sql.DB
}

// NewProductRepo - Constructor tạo repository mới
func NewProductRepo(db *sql.DB) ProductRepository {
	return &ProductRepo{DB: db}
}

// CreateProduct - Tạo sản phẩm (Có Transaction để đảm bảo toàn vẹn dữ liệu)
func (pr *ProductRepo) CreateProduct(product *model.Product, categoryIDs []int64) (*model.Product, error) {

	tx, err := pr.DB.Begin()
	if err != nil {
		return nil, err
	}

	query := `INSERT INTO products(name, slug, short_description, description, brand, status, is_published, published_at, min_price, discount_percent) 
              VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	res, err := tx.Exec(query, product.Name, product.Slug, product.ShortDescription, product.Description, product.Brand, product.Status, product.IsPublished, product.PublishedAt, product.MinPrice, product.DiscountPercent)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("cannot insert product: %v", err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	product.ID = id

	if len(categoryIDs) > 0 {
		catQuery := `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`
		stmt, err := tx.Prepare(catQuery)
		if err != nil {
			tx.Rollback()
			return nil, err
		}
		defer stmt.Close()

		for _, catID := range categoryIDs {
			_, err := stmt.Exec(product.ID, catID)
			if err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to link category %d: %v", catID, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return product, nil
}

// BulkCreateProducts - Tạo nhiều sản phẩm cùng lúc trong 1 Transaction
func (pr *ProductRepo) BulkCreateProducts(products []*model.Product, categoryIDsMapping [][]int64) error {
	if len(products) == 0 {
		return nil
	}

	tx, err := pr.DB.Begin()
	if err != nil {
		return fmt.Errorf("could not begin transaction: %w", err)
	}

	query := `INSERT INTO products(name, slug, short_description, description, brand, status, is_published, published_at, min_price, discount_percent) 
			  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	stmt, err := tx.Prepare(query)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to prepare insert product stmt: %w", err)
	}
	defer stmt.Close()

	catQuery := `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`
	catStmt, err := tx.Prepare(catQuery)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to prepare insert category stmt: %w", err)
	}
	defer catStmt.Close()

	for i, product := range products {
		res, err := stmt.Exec(product.Name, product.Slug, product.ShortDescription, product.Description, product.Brand, product.Status, product.IsPublished, product.PublishedAt, product.MinPrice, product.DiscountPercent)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("cannot insert product %s: %w", product.Name, err)
		}

		id, err := res.LastInsertId()
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("could not get last insert id for %s: %w", product.Name, err)
		}
		product.ID = id
		
		categoryIDs := categoryIDsMapping[i]
		if len(categoryIDs) > 0 {
			for _, catID := range categoryIDs {
				_, err := catStmt.Exec(product.ID, catID)
				if err != nil {
					tx.Rollback()
					return fmt.Errorf("failed to link category %d to product %d: %w", catID, product.ID, err)
				}
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetProductByID - Lấy sản phẩm theo ID
func (pr *ProductRepo) GetProductByID(id int64) (*model.Product, error) {

	query := `SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, discount_percent, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at 
			  FROM products 
			  WHERE id=? AND deleted_at IS NULL`

	rows := pr.DB.QueryRow(query, id)
	var product model.Product
	err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.DiscountPercent, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// GetProductByName
func (pr *ProductRepo) GetProductByName(name string) (*model.Product, error) {
	query := `SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, discount_percent, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at 
			  FROM products 
			  WHERE name=? AND deleted_at IS NULL`

	rows := pr.DB.QueryRow(query, name)
	var product model.Product
	err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.DiscountPercent, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// GetProductBySlug
func (pr *ProductRepo) GetProductBySlug(slug string) (*model.Product, error) {
	query := `SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, discount_percent, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at 
			  FROM products 
			  WHERE slug=? AND deleted_at IS NULL`

	rows := pr.DB.QueryRow(query, slug)
	var product model.Product
	err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.DiscountPercent, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// GetManyProduct - Lấy nhiều sản phẩm theo list ID
func (pr *ProductRepo) GetManyProduct(ids []int64) ([]model.Product, error) {
	if len(ids) == 0 {
		return []model.Product{}, nil
	}

	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]

	query := fmt.Sprintf(`
        SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, discount_percent, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at 
        FROM products 
        WHERE id IN (%s) AND deleted_at IS NULL`, placeholders)

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
		err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.DiscountPercent, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}

// SearchProducts - Tìm kiếm nâng cao (Hỗ trợ Name, Brand, Category, Price, Pagination, Sorting)
func (pr *ProductRepo) SearchProducts(req *model.SearchProductsRequest) ([]model.Product, int, error) {
	joinClause := ""
	whereClauses := []string{"p.deleted_at IS NULL"}
	args := []interface{}{}

	if req.CategoryID > 0 {
		joinClause += " JOIN product_categories pc ON p.id = pc.product_id"
		whereClauses = append(whereClauses, "pc.category_id = ?")
		args = append(args, req.CategoryID)
	}

	if req.Search != "" {
		whereClauses = append(whereClauses, "p.name LIKE ?")
		args = append(args, "%"+req.Search+"%")
	}

	if req.Brand != "" {
		whereClauses = append(whereClauses, "p.brand LIKE ?")
		args = append(args, "%"+req.Brand+"%")
	}

	if req.MinPriceFilter != nil {
		whereClauses = append(whereClauses, "(p.min_price * (1 - p.discount_percent / 100)) >= ?")
		args = append(args, *req.MinPriceFilter)
	}

	if req.MaxPriceFilter != nil {
		whereClauses = append(whereClauses, "(p.min_price * (1 - p.discount_percent / 100)) <= ?")
		args = append(args, *req.MaxPriceFilter)
	}

	whereStr := strings.Join(whereClauses, " AND ")

	// COUNT query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products p %s WHERE %s", joinClause, whereStr)
	var total int
	if err := pr.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("error counting products: %w", err)
	}

	// Sorting
	orderBy := "p.created_at DESC"
	switch req.SortBy {
	case "price":
		orderBy = "(p.min_price * (1 - p.discount_percent / 100))"
	case "rating":
		orderBy = "p.avg_rating"
	case "newest":
		orderBy = "p.created_at"
	case "name":
		orderBy = "p.name"
	}
	if req.SortBy != "" {
		if req.SortOrder == "asc" {
			orderBy += " ASC"
		} else {
			orderBy += " DESC"
		}
	}

	// Pagination defaults
	page := req.Page
	limit := req.Limit
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	baseQuery := `
		SELECT p.id, p.name, p.slug, p.short_description, p.description, p.brand, 
		       p.status, p.is_published, p.published_at, p.min_price, p.discount_percent,
		       p.avg_rating, p.rating_count, p.created_by, p.updated_by,
		       p.created_at, p.updated_at, p.deleted_at
		FROM products p
	`

	finalQuery := fmt.Sprintf("%s %s WHERE %s ORDER BY %s LIMIT ? OFFSET ?",
		baseQuery, joinClause, whereStr, orderBy,
	)

	queryArgs := append(args, limit, offset)
	rows, err := pr.DB.Query(finalQuery, queryArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("error searching products: %w", err)
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var p model.Product
		err := rows.Scan(
			&p.ID, &p.Name, &p.Slug, &p.ShortDescription, &p.Description,
			&p.Brand, &p.Status, &p.IsPublished, &p.PublishedAt,
			&p.MinPrice, &p.DiscountPercent, &p.AvgRating, &p.RatingCount,
			&p.CreatedBy, &p.UpdatedBy, &p.CreatedAt, &p.UpdatedAt, &p.DeletedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error scanning product: %w", err)
		}
		products = append(products, p)
	}
	return products, total, nil
}

// Check Conflict Name
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

// Check Conflict Slug
func (pr *ProductRepo) GetConflictProductBySlug(slug string) (bool, error) {
	var id int64
	err := pr.DB.QueryRow("SELECT id FROM products where slug=?", slug).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// UpdateProduct - Cập nhật thông tin và danh mục
func (pr *ProductRepo) UpdateProduct(product *model.Product, categoryIDs []int64) (*model.Product, error) {
	tx, err := pr.DB.Begin()
	if err != nil {
		return nil, err
	}

	query := `UPDATE products 
              SET name=?, slug=?, short_description=?, description=?, brand=?, status=?, is_published=?, published_at=?, min_price=?, discount_percent=?, updated_at=NOW() 
              WHERE id=? AND deleted_at IS NULL`

	res, err := tx.Exec(query, product.Name, product.Slug, product.ShortDescription, product.Description, product.Brand, product.Status, product.IsPublished, product.PublishedAt, product.MinPrice, product.DiscountPercent, product.ID)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("cannot update product: %v", err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {

		tx.Rollback()
		return nil, fmt.Errorf("product not found or already deleted")
	}

	if categoryIDs != nil {
		if len(categoryIDs) == 0 {
			tx.Rollback()
			return nil, fmt.Errorf("sản phẩm bắt buộc phải thuộc ít nhất 1 danh mục")
		}

		// Xóa liên kết cũ
		_, err = tx.Exec("DELETE FROM product_categories WHERE product_id = ?", product.ID)
		if err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("cannot clear old categories: %v", err)
		}

		// Insert liên kết mới
		catQuery := `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`
		stmt, err := tx.Prepare(catQuery)
		if err != nil {
			tx.Rollback()
			return nil, err
		}
		defer stmt.Close()

		for _, catID := range categoryIDs {
			_, err := stmt.Exec(product.ID, catID)
			if err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to link category %d: %v", catID, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return product, nil
}

// GetCategoriesByProductID - Hàm hỗ trợ lấy danh mục cho sp
func (pr *ProductRepo) GetCategoriesByProductID(productID int64) ([]model.Category, error) {
	query := `
        SELECT c.id, c.name, c.slug, c.description, c.is_active 
        FROM categories c
        JOIN product_categories pc ON c.id = pc.category_id
        WHERE pc.product_id = ?
    `
	rows, err := pr.DB.Query(query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var c model.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.IsActive); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, nil
}

// GetAllProducts - Lấy tất cả (kèm Categories, hỗ trợ phân trang)
func (pr *ProductRepo) GetAllProducts(req *model.SearchProductsRequest) ([]model.Product, int, error) {
	products, total, err := pr.SearchProducts(req)
	if err != nil {
		return nil, 0, err
	}

	// Map thêm category vào
	for i := range products {
		cats, err := pr.GetCategoriesByProductID(products[i].ID)
		if err == nil {
			products[i].Categories = cats
		}
	}

	return products, total, nil
}

//  DELETE

func (pr *ProductRepo) DeleteSoftProduct(id int64) error {
	_, err := pr.DB.Exec("UPDATE products SET deleted_at = CURRENT_TIMESTAMP , status = 'archived' WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("Cannot soft delete product: %w", err)
	}
	return nil
}

func (pr *ProductRepo) BulkDeleteSoftProducts(ids []int64) error {
	if len(ids) == 0 {
		return nil
	}
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]

	query := fmt.Sprintf(`
		UPDATE products 
		SET deleted_at = CURRENT_TIMESTAMP, status = 'archived'
		WHERE id IN (%s) AND deleted_at IS NULL
	`, placeholders)

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
	rows, err := pr.DB.Query("SELECT id, name, slug, short_description, description, brand, status, is_published, published_at, min_price, discount_percent, avg_rating, rating_count, created_by, updated_by, created_at, updated_at, deleted_at FROM products where status='archived' AND deleted_at IS NOT NULL")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	products := []model.Product{}
	for rows.Next() {
		var product model.Product
		if err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.ShortDescription, &product.Description, &product.Brand, &product.Status, &product.IsPublished, &product.PublishedAt, &product.MinPrice, &product.DiscountPercent, &product.AvgRating, &product.RatingCount, &product.CreatedBy, &product.UpdatedBy, &product.CreatedAt, &product.UpdatedAt, &product.DeletedAt); err != nil {
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
