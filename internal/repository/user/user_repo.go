package user

import (
	"database/sql"
	"golang/internal/logger"
	"golang/internal/model"
	"strings"
	"time"
)

// UserDb implement UserRepo
type UserDb struct {
	db *sql.DB
}

// NewUserDb khởi tạo repository
func NewUserDb(db *sql.DB) UserRepo {
	return &UserDb{db: db}
}

// Hàm Login kiểm tra username/email và password
func (u *UserDb) GetUserByIdentifier(identifier string) (model.User, error) {
	logger.DebugLogger.Printf("Starting GetUserByIdentifier for: %s", identifier)

	query := "SELECT id, username, email, password_hash, role, is_active, refresh_token, refresh_token_expiry, created_at, updated_at, deleted_at FROM users WHERE (username = ? OR email = ?) "

	var user model.User

	// Thực hiện truy vấn
	err := u.db.QueryRow(query, identifier, identifier).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.IsActive,
		&user.RefreshToken,
		&user.RefreshTokenExpiry,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)

	// Xử lý lỗi
	if err != nil {
		if err == sql.ErrNoRows {
			logger.DebugLogger.Printf("User not found: %s", identifier)
			return model.User{}, err
		}
		logger.ErrorLogger.Printf("GetUserByIdentifier failed: %v", err)
		return model.User{}, err
	}

	logger.InfoLogger.Printf("Found user: %s (ID: %d)", user.Username, user.ID)
	return user, nil
}

// Hàm lấy tất cả Users
func (u *UserDb) GetAllUsers() ([]model.User, error) {
	logger.DebugLogger.Println("Starting GetAllUser")

	// Truy vấn lấy tất cả users
	rows, err := u.db.Query("SELECT id, username, email, role, is_active, created_at, updated_at, deleted_at FROM users")
	if err != nil {
		logger.ErrorLogger.Printf("Query GetAllUser Failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var UserSlice []model.User
	for rows.Next() {
		var user model.User
		err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt, &user.DeletedAt)
		if err != nil {
			logger.ErrorLogger.Printf("Row Scan Failed: %v", err)
			return nil, err
		}
		UserSlice = append(UserSlice, user)
	}
	logger.InfoLogger.Println("GetAllUser executed successfully, total users:", len(UserSlice))
	return UserSlice, nil
}

// Hàm lấy User theo ID
func (u *UserDb) GetUserByID(id int64) (model.User, error) {
	logger.DebugLogger.Printf("Starting GetUserByID for ID: %d\n", id)
	var user model.User
	query := "SELECT id, username, email, role, is_active, created_at, updated_at, deleted_at FROM users WHERE id = ?"

	err := u.db.QueryRow(query, id).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt, &user.DeletedAt)
	if err != nil {
		logger.ErrorLogger.Printf("GetUserById failed: %v", err)
		return model.User{}, err
	}
	logger.InfoLogger.Printf("GetUserById success")
	return user, nil
}

// Hàm tìm kiếm Users theo từ khóa (username hoặc email)
func (u *UserDb) SearchUsers(filter model.UserFilter) ([]model.User, int, error) {
	logger.DebugLogger.Printf("Repo: Starting SearchUsers with Filter: %+v", filter)
	query := `SELECT id, username, email, role, is_active, created_at, updated_at, deleted_at 
              FROM users 
              WHERE 1=1`

	var args []interface{}

	// Lọc theo Keyword (Username hoặc Email)
	if filter.Keyword != "" {
		query += " AND (username LIKE ? OR email LIKE ?)"
		kw := "%" + filter.Keyword + "%"
		args = append(args, kw, kw)
	}

	// Lọc theo Role
	if filter.Role != "" {
		query += " AND role = ?"
		args = append(args, filter.Role)
	}

	// Lọc theo IsActive 
	if filter.IsActive != nil {
		query += " AND is_active = ?"
		args = append(args, *filter.IsActive)
	}

	// Lọc theo DeletedAt 
	if filter.IsDeleted != nil {
		if *filter.IsDeleted {
			query += " AND deleted_at IS NOT NULL"
		} else {
			query += " AND deleted_at IS NULL"
		}
	} else {
		// Mặc định chỉ lấy user chưa xóa 
		query += " AND deleted_at IS NULL"
	}

	// Đếm tổng số bản ghi để phân trang
	countQuery := "SELECT COUNT(*) FROM users WHERE " + query[strings.Index(query, "WHERE")+6:]
	var total int64

	if err := u.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		logger.ErrorLogger.Printf("Repo: Count query failed. Query: %s | Error: %v", countQuery, err)
		return nil, 0, err
	}

	// Thêm Pagination và Sorting
	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	offset := (filter.Page - 1) * filter.Limit
	args = append(args, filter.Limit, offset)

	logger.DebugLogger.Printf("Repo: Executing Main Query: %s | Args: %v", query, args)

	//  Thực thi Query chính
	rows, err := u.db.Query(query, args...)
	if err != nil {
		logger.ErrorLogger.Printf("Repo: Main query failed. Error: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var user model.User
		err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.Role,
			&user.IsActive, &user.CreatedAt, &user.UpdatedAt, &user.DeletedAt,
		)
		if err != nil {
			logger.ErrorLogger.Printf("Repo: Row scan failed. Error: %v", err)
			return nil, 0, err
		}
		users = append(users, user)
	}
	logger.InfoLogger.Printf("Repo: SearchUsers success. Retrieved %d/%d users.", len(users), total)
	return users, int(total), nil
}

// Hàm CreateUser (Tạo mới User)
func (u *UserDb) CreateUser(user model.User) (model.User, error) {
	logger.DebugLogger.Println("Starting CreateUser")

	now := time.Now()

	query := "INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"

	result, err := u.db.Exec(query, user.Username, user.Email, user.PasswordHash, user.Role, true, now, now)
	if err != nil {
		logger.ErrorLogger.Printf("CreateUser Failed: %v", err)
		return model.User{}, err
	}

	// Lấy ID của User vừa tạo
	newId, err := result.LastInsertId()
	if err != nil {
		logger.ErrorLogger.Printf("Get LastInsertId Failed: %v", err)
		return model.User{}, err
	}

	// Trả về User vừa tạo
	createUser := model.User{
		ID:        newId,
		Username:  user.Username,
		Email:     user.Email,
		Role:      user.Role,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}
	logger.InfoLogger.Printf("CreateUser success with ID: %d", newId)
	return createUser, nil
}

// Hàm cập nhật thông tin User (Admin dùng)
func (u *UserDb) UpdateUser(id int64, user model.AdminUpdateUserRequest) (model.User, error) {
	logger.DebugLogger.Println("Starting UpdateUser for ID:", id)
	now := time.Now()

	queryUpdate := `UPDATE users 
					SET role = COALESCE(?, role), 
						is_active = COALESCE(?, is_active), 
						updated_at = ? 
					WHERE id = ? AND deleted_at IS NULL`

	res, err := u.db.Exec(queryUpdate, user.Role, user.IsActive, now, id)
	if err != nil {
		logger.ErrorLogger.Printf("UpdateUser (Exec) Failed: %v", err)
		return model.User{}, err
	}

	// Kiểm tra xem có dòng nào được update không
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		logger.WarnLogger.Printf("No user updated (ID not found or no changes): %d", id)
		return model.User{}, sql.ErrNoRows
	}

	logger.InfoLogger.Printf("UpdateUser success for ID: %d", id)
	return u.GetUserByID(id)
}

// Hàm User tự cập nhật Profile
func (u *UserDb) UpdateUserProfile(id int64, req model.UserUpdateProfileRequest) (model.User, error) {
	logger.DebugLogger.Printf("Starting UpdateUserProfile for ID: %d", id)
	now := time.Now()

	queryUpdate := `UPDATE users 
					SET username = COALESCE(?, username), 
						email = COALESCE(?, email), 
						password_hash = COALESCE(?, password_hash),
						updated_at = ? 
					WHERE id = ? AND deleted_at IS NULL`

	_, err := u.db.Exec(queryUpdate,
		req.Username,
		req.Email,
		req.Password,
		now,
		id,
	)

	if err != nil {
		logger.ErrorLogger.Printf("UpdateUserProfile (Exec) Failed: %v", err)
		return model.User{}, err
	}

	logger.InfoLogger.Printf("UpdateUserProfile success for ID: %d", id)
	return u.GetUserByID(id)
}

// Hàm cập nhật Refresh Token và Expiry
func (u *UserDb) UpdateRefreshToken(id int64, token string, expiry time.Time) error {

	query := `UPDATE users SET refresh_token = ?, refresh_token_expiry = ? WHERE id = ?`
	_, err := u.db.Exec(query, token, expiry, id)
	return err
}

// Hàm xóa nhiều User cùng lúc (soft delete)
func (u *UserDb) DeleteSoftUsers(ids []int64) error {
	logger.DebugLogger.Printf("Starting DeleteManyUsers for %d users", len(ids))

	// Bắt đầu transaction
	tx, err := u.db.Begin()
	if err != nil {
		logger.ErrorLogger.Printf("Failed to begin transaction: %v", err)
		return err
	}

	query := `UPDATE users SET deleted_at = ?, is_active = 0 WHERE id = ?`

	stmt, err := tx.Prepare(query)
	if err != nil {
		tx.Rollback()
		logger.ErrorLogger.Printf("Failed to prepare statement: %v", err)
		return err
	}
	defer stmt.Close()

	now := time.Now()

	// Duyệt qua danh sách ID và thực thi
	for _, id := range ids {
		_, err := stmt.Exec(now, id)
		if err != nil {
			tx.Rollback() // Gặp lỗi ở bất kỳ user nào -> Hoàn tác toàn bộ
			logger.ErrorLogger.Printf("Failed to delete user ID %d: %v", id, err)
			return err
		}
	}

	//Commit (Lưu thay đổi)
	if err := tx.Commit(); err != nil {
		logger.ErrorLogger.Printf("Failed to commit transaction: %v", err)
		return err
	}

	logger.InfoLogger.Printf("DeleteManyUsers success, %d users marked as deleted", len(ids))
	return nil
}

// Hàm Hủy Refresh Token (Dùng cho Logout)
func (u *UserDb) RevokeRefreshToken(userID int64) error {
	logger.DebugLogger.Printf("Revoking refresh token for User ID: %d", userID)

	query := `UPDATE users SET refresh_token = NULL, refresh_token_expiry = NULL WHERE id = ?`

	_, err := u.db.Exec(query, userID)
	if err != nil {
		logger.ErrorLogger.Printf("RevokeRefreshToken failed: %v", err)
		return err
	}

	return nil
}

// Hàm tìm User bằng Refresh Token (để cấp lại Access Token)
func (u *UserDb) GetUserByRefreshToken(refreshToken string) (model.User, error) {

	query := `SELECT id, username, email, role, is_active FROM users 
              WHERE refresh_token = ? AND refresh_token_expiry > NOW()`

	var user model.User
	err := u.db.QueryRow(query, refreshToken).Scan(
		&user.ID, &user.Username, &user.Email, &user.Role, &user.IsActive,
	)

	if err != nil {
		// Log warning khi không tìm thấy hoặc token hết hạn
		logger.WarnLogger.Printf("Refresh token invalid or expired: %v", err)
		return model.User{}, err
	}
	return user, nil
}
