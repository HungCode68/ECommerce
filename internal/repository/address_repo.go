package repository

import (
	"database/sql"
	"golang/internal/logger"
	"golang/internal/model"
	"time"
)

type AddressRepo interface {
	CreateAddress(address model.Address) (model.Address, error)
	GetAddressByID(id int64,userID int64) (model.Address, error)
	GetAddressesByUserID(userID int64) ([]model.Address, error)
	UpdateAddress(id int64, userID int64, req model.UpdateAddressRequest) (model.Address, error)
	DeleteAddress(id int64, userID int64) error
	SetDefaultAddress(userID int64, addressID int64) error
}


type AddressDb struct {
	db *sql.DB
}

func NewAddressDb(db *sql.DB) AddressRepo {
	return &AddressDb{db: db}
}

//Tạo địa chỉ mới
func (r *AddressDb) CreateAddress(address model.Address) (model.Address, error) {
	logger.DebugLogger.Printf("Starting CreateAddress for UserID: %d", address.UserID)

	query := `
		INSERT INTO addresses (user_id, label, recipient_name, phone, line1, line2, city, state, country, is_default_shipping, created_at, updated_at)
		OUTPUT INSERTED.id
		VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12)`

	var newID int64
	now := time.Now()

	err := r.db.QueryRow(query,
		address.UserID,
		address.Label,
		address.RecipientName,
		address.Phone,
		address.Line1,
		address.Line2,
		address.City,
		address.State,
		address.Country,
		address.IsDefaultShipping,
		now, 
		now, 
	).Scan(&newID)

	if err != nil {
		logger.ErrorLogger.Printf("CreateAddress Failed: %v", err)
		return model.Address{}, err
	}

	// Gán lại ID và thời gian để trả về
	address.ID = newID
	address.CreatedAt = now
	address.UpdatedAt = now

	logger.InfoLogger.Printf("CreateAddress success with ID: %d", newID)
	return address, nil
}

// Lấy chi tiết địa chỉ theo ID
func (r *AddressDb) GetAddressByID(id int64, userID int64) (model.Address, error) {
	logger.DebugLogger.Printf("Starting GetAddressByID: %d", id)

	query := `
		SELECT id, user_id, COALESCE(label, ''), recipient_name, phone, line1, COALESCE(line2, ''), city, COALESCE(state, ''), country, is_default_shipping, created_at, updated_at
		FROM addresses
		WHERE id = @p1 AND user_id = @p2`

	var addr model.Address
	err := r.db.QueryRow(query, id, userID).Scan(
		&addr.ID,
		&addr.UserID,
		&addr.Label,
		&addr.RecipientName,
		&addr.Phone,
		&addr.Line1,
		&addr.Line2,
		&addr.City,
		&addr.State,
		&addr.Country,
		&addr.IsDefaultShipping,
		&addr.CreatedAt,
		&addr.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			logger.WarnLogger.Printf("Address ID %d not found", id)
			return model.Address{}, err
		}
		logger.ErrorLogger.Printf("GetAddressByID Failed: %v", err)
		return model.Address{}, err
	}

	return addr, nil
}

// Lấy danh sách địa chỉ của một User
func (r *AddressDb) GetAddressesByUserID(userID int64) ([]model.Address, error) {
	logger.DebugLogger.Printf("Starting GetAddressesByUserID: %d", userID)

	// Sắp xếp: Địa chỉ mặc định lên đầu, sau đó đến mới nhất
	query := `
		SELECT id, user_id, COALESCE(label, ''), recipient_name, phone, line1, COALESCE(line2, ''), city, COALESCE(state, ''), country, is_default_shipping, created_at, updated_at
		FROM addresses
		WHERE user_id = @p1
		ORDER BY is_default_shipping DESC, created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		logger.ErrorLogger.Printf("Query GetAddressesByUserID Failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var addresses []model.Address
	for rows.Next() {
		var addr model.Address
		err := rows.Scan(
			&addr.ID,
			&addr.UserID,
			&addr.Label,
			&addr.RecipientName,
			&addr.Phone,
			&addr.Line1,
			&addr.Line2,
			&addr.City,
			&addr.State,
			&addr.Country,
			&addr.IsDefaultShipping,
			&addr.CreatedAt,
			&addr.UpdatedAt,
		)
		if err != nil {
			logger.ErrorLogger.Printf("Scan Row Failed: %v", err)
			return nil, err
		}
		addresses = append(addresses, addr)
	}

	return addresses, nil
}

// Cập nhật địa chỉ (Update)
func (r *AddressDb) UpdateAddress(id int64, userID int64, req model.UpdateAddressRequest) (model.Address, error) {
	logger.DebugLogger.Printf("Starting UpdateAddress ID: %d", id)
	now := time.Now()

	queryUpdate := `
		UPDATE addresses
		SET 
			label = COALESCE(@p1, label),
			recipient_name = COALESCE(@p2, recipient_name),
			phone = COALESCE(@p3, phone),
			line1 = COALESCE(@p4, line1),
			line2 = COALESCE(@p5, line2),
			city = COALESCE(@p6, city),
			state = COALESCE(@p7, state),
			country = COALESCE(@p8, country),
			is_default_shipping = COALESCE(@p9, is_default_shipping),
			updated_at = @p10
		WHERE id = @p11`

	res, err := r.db.Exec(queryUpdate,
		req.Label,
		req.RecipientName,
		req.Phone,
		req.Line1,
		req.Line2,
		req.City,
		req.State,
		req.Country,
		req.IsDefaultShipping,
		now,
		id,
	)

	if err != nil {
		logger.ErrorLogger.Printf("UpdateAddress (Exec) Failed: %v", err)
		return model.Address{}, err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return model.Address{}, sql.ErrNoRows
	}

	// Select lại dữ liệu mới nhất (Tránh lỗi Trigger Output của SQL Server)
	return r.GetAddressByID(id, userID)
}

// Xóa địa chỉ (Hard Delete)
func (r *AddressDb) DeleteAddress(id int64, userID int64) error {
	logger.DebugLogger.Printf("Starting DeleteAddress ID: %d", id)

	query := "DELETE FROM addresses WHERE id = @p1 AND user_id = @p2"

	res, err := r.db.Exec(query, id, userID)
	if err != nil {
		logger.ErrorLogger.Printf("DeleteAddress Failed: %v", err)
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	logger.InfoLogger.Printf("DeleteAddress success ID: %d", id)
	return nil
}

// Đặt làm địa chỉ mặc định (Transaction)
func (r *AddressDb) SetDefaultAddress(userID int64, addressID int64) error {
	logger.DebugLogger.Printf("Setting default address ID %d for User %d", addressID, userID)

	// Bắt đầu Transaction vì cần update nhiều dòng
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	// Reset tất cả địa chỉ của user này về false (0)
	queryReset := "UPDATE addresses SET is_default_shipping = 0 WHERE user_id = @p1"
	if _, err := tx.Exec(queryReset, userID); err != nil {
		tx.Rollback()
		logger.ErrorLogger.Printf("SetDefaultAddress (Reset) Failed: %v", err)
		return err
	}

	// Set địa chỉ được chọn thành true (1)
	querySet := "UPDATE addresses SET is_default_shipping = 1 WHERE id = @p1 AND user_id = @p2"
	res, err := tx.Exec(querySet, addressID, userID)
	if err != nil {
		tx.Rollback()
		logger.ErrorLogger.Printf("SetDefaultAddress (Set) Failed: %v", err)
		return err
	}

	// Kiểm tra xem ID có tồn tại không
	rows, _ := res.RowsAffected()
	if rows == 0 {
		tx.Rollback()
		return sql.ErrNoRows
	}

	// Commit Transaction
	if err := tx.Commit(); err != nil {
		return err
	}

	logger.InfoLogger.Printf("SetDefaultAddress success")
	return nil
}