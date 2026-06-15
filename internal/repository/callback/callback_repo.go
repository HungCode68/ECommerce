package callback

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
)

type callbackRepo struct {
	db *sql.DB
}

func NewCallbackRepo(db *sql.DB) CallbackRepository {
	return &callbackRepo{db: db}
}

func (r *callbackRepo) Create(req *model.CallbackRequest) (*model.CallbackRequest, error) {
	res, err := r.db.Exec(`
		INSERT INTO callback_requests (phone_number, reason, status)
		VALUES (?, ?, ?)`,
		req.PhoneNumber,
		req.Reason,
		req.Status,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

func (r *callbackRepo) GetAll(status string, limit, offset int) ([]model.CallbackRequest, error) {
	query := `SELECT id, phone_number, COALESCE(reason, ''), status, created_at, updated_at FROM callback_requests`
	var args []any

	if status != "" {
		query += ` WHERE status = ?`
		args = append(args, status)
	}

	query += ` ORDER BY id DESC LIMIT ? OFFSET ?`
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.CallbackRequest
	for rows.Next() {
		var item model.CallbackRequest
		if err := rows.Scan(
			&item.ID,
			&item.PhoneNumber,
			&item.Reason,
			&item.Status,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, nil
}

func (r *callbackRepo) Count(status string) (int, error) {
	query := `SELECT COUNT(*) FROM callback_requests`
	var args []any

	if status != "" {
		query += ` WHERE status = ?`
		args = append(args, status)
	}

	var total int
	err := r.db.QueryRow(query, args...).Scan(&total)
	return total, err
}

func (r *callbackRepo) GetByID(id int64) (*model.CallbackRequest, error) {
	var item model.CallbackRequest
	err := r.db.QueryRow(`
		SELECT id, phone_number, COALESCE(reason, ''), status, created_at, updated_at
		FROM callback_requests
		WHERE id = ?`, id).Scan(
		&item.ID,
		&item.PhoneNumber,
		&item.Reason,
		&item.Status,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *callbackRepo) Update(req *model.CallbackRequest) (*model.CallbackRequest, error) {
	res, err := r.db.Exec(`
		UPDATE callback_requests
		SET phone_number = ?, reason = ?, status = ?, updated_at = NOW()
		WHERE id = ?`,
		req.PhoneNumber,
		req.Reason,
		req.Status,
		req.ID,
	)
	if err != nil {
		return nil, err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rowsAffected == 0 {
		return nil, fmt.Errorf("callback request not found")
	}
	return r.GetByID(req.ID)
}

func (r *callbackRepo) Delete(id int64) error {
	res, err := r.db.Exec(`DELETE FROM callback_requests WHERE id = ?`, id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("callback request not found")
	}
	return nil
}
