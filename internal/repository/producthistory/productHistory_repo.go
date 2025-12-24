package producthistory

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"golang/internal/model"
	"strings"
)

type HistoryRepo struct {
	DB *sql.DB
}

func NewProductHistoryRepo(db *sql.DB) ProductHistoryRepository {
	return &HistoryRepo{DB: db}
}

// CreateProductHistory - Tạo bản ghi lịch sử thay đổi sản phẩm
func (ph *HistoryRepo) CreateProductHistory(history *model.ProductHistory) (*model.ProductHistory, error) {
	query, err := ph.DB.Exec(`INSERT INTO product_history (product_id, variant_id, admin_id, changed_at, changes, note) VALUES (?,?,?,now(),?,?)`,
		history.ProductID, history.VariantID, history.AdminID, history.Changes, history.Note)
	if err != nil {
		return nil, err
	}
	id, err := query.LastInsertId()
	if err != nil {
		return nil, err
	}
	history.ID = id
	return history, nil
}

// Thêm hàm này vào Interface và Struct implementation
func (r *HistoryRepo) GetProductHistoryByProductID(productID []int64) ([]model.ProductHistory, error) {
	if len(productID) == 0 {
		return []model.ProductHistory{}, nil
	}

	// 1. Tạo mảng chứa dấu hỏi (?)
	placeholders := make([]string, len(productID))
	for i := range placeholders {
		placeholders[i] = "?" // <--- QUAN TRỌNG: Phải điền dấu hỏi vào
	}

	// 2. Join lại thành chuỗi "?, ?, ?"
	query := fmt.Sprintf(`SELECT id, product_id, variant_id, admin_id, changed_at, changes, note 
                          FROM product_history 
                          WHERE product_id IN (%s)
                          ORDER BY changed_at DESC`, strings.Join(placeholders, ","))

	// 3. Chuẩn bị tham số
	args := make([]interface{}, len(productID))
	for i, id := range productID {
		args[i] = id
	}

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var histories []model.ProductHistory
	for rows.Next() {
		var h model.ProductHistory
		// Lưu ý: Đảm bảo thứ tự cột trong Scan khớp với SELECT
		if err := rows.Scan(&h.ID, &h.ProductID, &h.VariantID, &h.AdminID, &h.ChangedAt, &h.Changes, &h.Note); err != nil {
			return nil, err
		}
		histories = append(histories, h)
	}
	return histories, nil
}
func (r *HistoryRepo) GetAllProductsHistory(limit, offset int) ([]model.ProductHistory, error) {
	query := `SELECT id, product_id, variant_id, admin_id, changed_at, changes, note 
	          FROM product_history 
	          ORDER BY changed_at 
			  LIMIT ? OFFSET ?`

	rows, err := r.DB.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var histories []model.ProductHistory
	for rows.Next() {
		var h model.ProductHistory
		var changesBytes []byte
		if err := rows.Scan(&h.ID, &h.ProductID, &h.VariantID, &h.AdminID, &h.ChangedAt, &changesBytes, &h.Note); err != nil {
			return nil, err
		}
		if changesBytes != nil {
			h.Changes = changesBytes
		} else {
			h.Changes = json.RawMessage("{}")
		}

		histories = append(histories, h)
	}
	return histories, nil
}

func (r *HistoryRepo) CountProductsHistory() (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM product_history`
	err := r.DB.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}
