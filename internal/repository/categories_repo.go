package repository

import (
	"database/sql"
	"fmt"
	"golang/internal/logger"
	"golang/internal/model"
	"time"

	"github.com/gosimple/slug"
)

// CategoryRepo định nghĩa các phương thức thao tác với bảng categories
type CategoryRepo interface {
	CreateCategory(category *model.Category) (*model.Category, error)
	UpdateCategory(id int64, req model.UpdateCategoryRequest) (*model.Category, error)
	DeleteCategory(id int64) error
	DeleteManyCategories(ids []int64) error
	DeleteCategoryHard(id int64) error
	GetCategoryByID(id int64) (*model.Category, error)
	GetAllCategories() ([]model.Category, error)
	SearchAllCategories(keyword string) ([]model.Category, error)

	GetActiveCategories() ([]model.Category, error)
	SearchActiveCategories(keyword string) ([]model.Category, error)

	CountProductsByCategoryID(categoryID int64) (int, error)
	CheckSlugExist(slug string) (bool, error)
}

// CategoryDb implement CategoryRepo
type CategoryDb struct {
	db *sql.DB
}

// NewCategoryDb khởi tạo repository
func NewCategoryDb(db *sql.DB) CategoryRepo {
	return &CategoryDb{db: db}
}

// Tạo danh mục mới
func (r *CategoryDb) CreateCategory(category *model.Category) (*model.Category, error) {
	logger.DebugLogger.Printf("Starting CreateCategory: %s", category.Name)

	now := time.Now()
	query := `INSERT INTO categories (name, slug, description, is_active, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?)`

	// Exec trả về Result
	result, err := r.db.Exec(query,
		category.Name,
		category.Slug,
		category.Description,
		category.IsActive,
		now,
		now,
	)

	if err != nil {
		logger.ErrorLogger.Printf("CreateCategory Failed: %v", err)
		return nil, fmt.Errorf("cannot create category: %w", err)
	}

	// Lấy ID vừa tạo
	id, err := result.LastInsertId()
	if err != nil {
		logger.ErrorLogger.Printf("Get LastInsertId Failed: %v", err)
		return nil, err
	}

	// Gán lại thông tin để trả về
	category.ID = id
	category.CreatedAt = now
	category.UpdatedAt = now

	logger.InfoLogger.Printf("CreateCategory success with ID: %d", id)
	return category, nil
}

// Lấy danh mục theo ID
func (r *CategoryDb) GetCategoryByID(id int64) (*model.Category, error) {
	logger.DebugLogger.Printf("Starting GetCategoryByID: %d", id)

	query := `SELECT id, name, slug, description, is_active, created_at, updated_at 
			  FROM categories WHERE id = ?`

	var cat model.Category
	err := r.db.QueryRow(query, id).Scan(
		&cat.ID, &cat.Name, &cat.Slug, &cat.Description,
		&cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			logger.WarnLogger.Printf("Category ID %d not found", id)
			return nil, err
		}
		logger.ErrorLogger.Printf("GetCategoryByID Failed: %v", err)
		return nil, err
	}

	return &cat, nil
}


// AdminSearchCategories: Tìm kiếm danh mục theo tên (Lấy cả Active và Inactive)
func (r *CategoryDb) SearchAllCategories(keyword string) ([]model.Category, error) {
	logger.DebugLogger.Printf("Starting AdminSearchCategories with keyword: %s", keyword)

	nameKeyword := "%" + keyword + "%"
	slugKeyword := "%" + slug.Make(keyword) + "%" 
	
	query := `SELECT id, name, slug, description, is_active, created_at, updated_at 
			  FROM categories 
			  WHERE name LIKE ? OR slug LIKE ? 
			  ORDER BY created_at DESC`

	// Truyền 2 tham số vào
	rows, err := r.db.Query(query, nameKeyword, slugKeyword)
	if err != nil {
		logger.ErrorLogger.Printf("AdminSearchCategories Query Failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	categories := []model.Category{}

	for rows.Next() {
		var cat model.Category
		err := rows.Scan(&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt)
		if err != nil {
			logger.ErrorLogger.Printf("Scan Row Failed: %v", err)
			return nil, err
		}
		categories = append(categories, cat)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	logger.InfoLogger.Printf("AdminSearchCategories success, found %d records", len(categories))
	return categories, nil
}

// Implement hàm tìm kiếm
func (r *CategoryDb) SearchActiveCategories(keyword string) ([]model.Category, error) {
	logger.DebugLogger.Printf("Searching categories with keyword: %s", keyword)

	// Tạo 2 biến tìm kiếm
	nameKeyword := "%" + keyword + "%"
	slugKeyword := "%" + slug.Make(keyword) + "%"

	query := `SELECT id, name, slug, description, is_active, created_at, updated_at 
              FROM categories 
              WHERE (name LIKE ? OR slug LIKE ?) AND is_active = 1 
              ORDER BY created_at DESC`

	rows, err := r.db.Query(query, nameKeyword, slugKeyword)
	if err != nil {
		logger.ErrorLogger.Printf("SearchActiveCategories Query Failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var cat model.Category
		err := rows.Scan(&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt)
		if err != nil {
			return nil, err
		}
		categories = append(categories, cat)
	}

	return categories, nil
}

// Lấy tất cả danh mục
func (r *CategoryDb) GetAllCategories() ([]model.Category, error) {
	logger.DebugLogger.Println("Starting GetAllCategories")

	query := `SELECT id, name, slug, description, is_active, created_at, updated_at 
			  FROM categories ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		logger.ErrorLogger.Printf("Query GetAllCategories Failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var cat model.Category
		err := rows.Scan(
			&cat.ID, &cat.Name, &cat.Slug, &cat.Description,
			&cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt,
		)
		if err != nil {
			logger.ErrorLogger.Printf("Scan Row Failed: %v", err)
			return nil, err
		}
		categories = append(categories, cat)
	}

	logger.InfoLogger.Printf("GetAllCategories success, found %d records", len(categories))
	return categories, nil
}

// Lấy tất cả danh mục đang kích hoạt (Active)
func (r *CategoryDb) GetActiveCategories() ([]model.Category, error) {
	logger.DebugLogger.Println("Starting GetActiveCategories")

	query := `SELECT id, name, slug, description, is_active, created_at, updated_at 
              FROM categories 
              WHERE is_active = 1 
              ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		logger.ErrorLogger.Printf("Query GetActiveCategories Failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	categories := []model.Category{}

	for rows.Next() {
		var cat model.Category
		err := rows.Scan(
			&cat.ID, &cat.Name, &cat.Slug, &cat.Description,
			&cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt,
		)
		if err != nil {
			logger.ErrorLogger.Printf("Scan Row Failed: %v", err)
			return nil, err
		}
		categories = append(categories, cat)
	}

	if err = rows.Err(); err != nil {
		logger.ErrorLogger.Printf("Iteration Error: %v", err)
		return nil, err
	}

	logger.InfoLogger.Printf("GetActiveCategories success, found %d records", len(categories))
	return categories, nil
}

// Cập nhật danh mục
func (r *CategoryDb) UpdateCategory(id int64, req model.UpdateCategoryRequest) (*model.Category, error) {
	logger.DebugLogger.Printf("Starting UpdateCategory ID: %d", id)
	now := time.Now()

	queryUpdate := `UPDATE categories 
					SET name = COALESCE(?, name),
						slug = COALESCE(?, slug),
						description = COALESCE(?, description),
						is_active = COALESCE(?, is_active),
						updated_at = ?
					WHERE id = ?`

	res, err := r.db.Exec(queryUpdate,
		req.Name,
		req.Slug,
		req.Description,
		req.IsActive,
		now,
		id,
	)

	if err != nil {
		logger.ErrorLogger.Printf("UpdateCategory (Exec) Failed: %v", err)
		return nil, err
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		logger.WarnLogger.Printf("No rows affected for UpdateCategory ID: %d", id)
	}

	// Select lại dữ liệu mới nhất để trả về
	return r.GetCategoryByID(id)
}

// Xóa mềm 1 danh mục (Thực chất là Hủy kích hoạt - Deactivate)
func (r *CategoryDb) DeleteCategory(id int64) error {
	logger.DebugLogger.Printf("Starting Soft DeleteCategory (Deactivate) ID: %d", id)

	query := "UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?"

	now := time.Now()
	res, err := r.db.Exec(query, now, id)
	if err != nil {
		logger.ErrorLogger.Printf("Soft DeleteCategory Failed: %v", err)
		return err
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}

	logger.InfoLogger.Printf("Category ID %d deactivated successfully", id)
	return nil
}

// Xóa mềm nhiều danh mục (Transaction)
func (r *CategoryDb) DeleteManyCategories(ids []int64) error {
	logger.DebugLogger.Printf("Starting Soft DeleteManyCategories: %d items", len(ids))

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	// Chuẩn bị câu lệnh Update
	query := "UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?"
	stmt, err := tx.Prepare(query)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	now := time.Now()

	for _, id := range ids {
		_, err := stmt.Exec(now, id)
		if err != nil {
			tx.Rollback()
			logger.ErrorLogger.Printf("Failed to deactivate category ID %d: %v", id, err)
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	logger.InfoLogger.Println("DeleteManyCategories (Deactivate) success")
	return nil
}


// Xóa cứng danh mục (Chỉ cho phép khi không có sản phẩm)
func (r *CategoryDb) DeleteCategoryHard(id int64) error {
    logger.DebugLogger.Printf("Yêu cầu xóa cứng danh mục ID: %d", id)

    // Kiểm tra ràng buộc sản phẩm
    count, err := r.CountProductsByCategoryID(id)
    if err != nil {
        return err
    }

    if count > 0 {
        return fmt.Errorf("không thể xóa: danh mục này đang chứa %d sản phẩm. Vui lòng gỡ sản phẩm trước", count)
    }

    //  Thực hiện xóa vĩnh viễn
    query := "DELETE FROM categories WHERE id = ?"
    res, err := r.db.Exec(query, id)
    if err != nil {
        logger.ErrorLogger.Printf("Hard Delete Failed: %v", err)
        return err
    }

    rows, _ := res.RowsAffected()
    if rows == 0 {
        return sql.ErrNoRows
    }

    logger.InfoLogger.Printf("Đã xóa vĩnh viễn danh mục ID %d", id)
    return nil
}

// Kiểm tra xem danh mục có đang chứa sản phẩm nào không
func (r *CategoryDb) CountProductsByCategoryID(categoryID int64) (int, error) {
    var count int
    // Đếm trong bảng trung gian product_categories
    query := "SELECT COUNT(*) FROM product_categories WHERE category_id = ?"
    err := r.db.QueryRow(query, categoryID).Scan(&count)
    if err != nil {
        return 0, err
    }
    return count, nil
}

// Kiểm tra Slug đã tồn tại chưa (Dùng khi Create/Update)
func (r *CategoryDb) CheckSlugExist(slug string) (bool, error) {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM categories WHERE slug = ?)"
	// MySQL trả về 1 hoặc 0
	err := r.db.QueryRow(query, slug).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
