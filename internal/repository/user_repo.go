package repository

import (
	"database/sql"
	"golang/internal/logger"
	"golang/internal/model"
	"time"
)

// UserRepo định nghĩa các phương thức thao tác với DB
type UserRepo interface {
	GetAllUser() ([]model.UserResponse, error)
	GetUserByID(id int64) (model.UserResponse, error)
	SearchUsers(keyword string) ([]model.UserResponse, error)
	GetUserByIdentifier(identifier string) (model.User, error)
	GetUserByRefreshToken(refreshToken string) (model.User, error)
	CreateUser(user model.User) (model.User, error)
	UpdateUser(id int64, req model.UpdateUserRequest) (model.User, error)
	UpdateUserProfile(id int64, req model.UpdateProfileRequest) (model.User, error)
	UpdateRefreshToken(id int64, refreshToken string, expiry time.Time) error
	DeleteUserById(id int64) error
	DeleteManyUsers(ids []int64) error
	RevokeRefreshToken(userID int64) error
}

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
	query := "SELECT id, username, email, password_hash, role, is_active, refresh_token, refresh_token_expiry, created_at, updated_at, deleted_at FROM users WHERE (username = @p1 OR email = @p1) "
	var user model.User
	err := u.db.QueryRow(query, identifier).Scan(
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
func (u *UserDb) GetAllUser() ([]model.UserResponse, error) {
	logger.DebugLogger.Println("Starting GetAllUser")
	rows, err := u.db.Query("SELECT id, username, email, role, is_active, created_at, updated_at, deleted_at FROM users ")
	if err != nil {
		logger.ErrorLogger.Printf("Query GetAllUser Failed:", err)
		return nil, err
	}
	defer rows.Close()

	var UserSlice []model.UserResponse
	for rows.Next() {
		var user model.UserResponse
		err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt, &user.DeletedAt)
		if err != nil {
			logger.ErrorLogger.Printf("Row Scan Failed:", err)
			return nil, err
		}
		UserSlice = append(UserSlice, user)
	}
	logger.InfoLogger.Println("GetAllUser executed successfully, total users:", len(UserSlice))
	return UserSlice, nil
}

// Hàm lấy User theo ID
func (u *UserDb) GetUserByID(id int64) (model.UserResponse, error) {
	logger.DebugLogger.Printf("Starting GetUserByID for ID: %d\n", id)
	var user model.UserResponse
	err := u.db.QueryRow("SELECT id, username, email, role, is_active, created_at, updated_at, deleted_at FROM users WHERE id = @p1", id).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt, &user.DeletedAt)
	if err != nil {
		logger.ErrorLogger.Printf("GetUserById failed:", err)
		return model.UserResponse{}, err
	}
	logger.InfoLogger.Printf("GetUserById success")
	return user, nil
}

// Hàm tìm kiếm Users theo từ khóa (username hoặc email)
func (u *UserDb) SearchUsers(keyword string) ([]model.UserResponse, error) {
	logger.DebugLogger.Printf("Starting SearchUsers with keyword: %s", keyword)
	searchTerm := "%" + keyword + "%"
	query := "SELECT id, username, email, role, is_active, created_at, updated_at, deleted_at FROM users WHERE (username LIKE @p1 OR email LIKE @p1)"

	rows, err := u.db.Query(query, searchTerm)
	if err != nil {
		logger.ErrorLogger.Printf("SearchUsers Query Failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var userSlice []model.UserResponse
	for rows.Next() {
		var user model.UserResponse

		err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt, &user.DeletedAt)
		if err != nil {
			logger.ErrorLogger.Printf("SearchUsers Row Scan Failed: %v", err)
			return nil, err
		}
		userSlice = append(userSlice, user)
	}

	logger.InfoLogger.Printf("SearchUsers found %d records for keyword '%s'", len(userSlice), keyword)
	return userSlice, nil
}

// Hàm tạo mới User
func (u *UserDb) CreateUser(user model.User) (model.User, error) {
	logger.DebugLogger.Println("Starting CreateUser")
	var newId int64
	query := "INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at) OUTPUT INSERTED.id VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7)"
	err := u.db.QueryRow(query, user.Username, user.Email, user.PasswordHash, user.Role, true, time.Now(), time.Now()).Scan(&newId)
	if err != nil {
		logger.ErrorLogger.Printf("CreateUser Failed:", err)
		return model.User{}, err
	}
	createUser := model.User{
		ID:        newId,
		Username:  user.Username,
		Email:     user.Email,
		Role:      user.Role,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	logger.InfoLogger.Printf("CreateUser success with ID: %d", newId)
	return createUser, nil
}

// Hàm cập nhật thông tin User
func (u *UserDb) UpdateUser(id int64, user model.UpdateUserRequest) (model.User, error) {
	logger.DebugLogger.Println("Starting UpdateUser for ID:", id)
	now := time.Now()

	queryUpdate := `UPDATE users 
	                SET role = COALESCE(@p1, role), 
	                    is_active = COALESCE(@p2, is_active), 
	                    updated_at = @p3 
	                WHERE id = @p4 AND deleted_at IS NULL`

	res, err := u.db.Exec(queryUpdate, user.Role, user.IsActive, now, id)
	if err != nil {
		logger.ErrorLogger.Printf("UpdateUser (Exec) Failed: %v", err)
		return model.User{}, err
	}

	// Kiểm tra xem có dòng nào được update không (Optional nhưng nên làm)
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		logger.WarnLogger.Printf("No user found to update with ID: %d", id)
		return model.User{}, sql.ErrNoRows
	}

	querySelect := `SELECT id, username, email, role, is_active, created_at, updated_at 
	                FROM users WHERE id = @p1`

	var updatedUser model.User
	err = u.db.QueryRow(querySelect, id).Scan(
		&updatedUser.ID,
		&updatedUser.Username,
		&updatedUser.Email,
		&updatedUser.Role,
		&updatedUser.IsActive,
		&updatedUser.CreatedAt,
		&updatedUser.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			logger.WarnLogger.Printf("No user found with ID: %d", id)
			return model.User{}, err
		}
		logger.ErrorLogger.Printf("UpdateUser (Select) Failed: %v", err)
		return model.User{}, err
	}

	logger.InfoLogger.Printf("UpdateUser success for ID: %d", id)
	return updatedUser, nil
}

// Hàm User tự cập nhật Profile (Username, Email, Password)
func (u *UserDb) UpdateUserProfile(id int64, req model.UpdateProfileRequest) (model.User, error) {
	logger.DebugLogger.Printf("Starting UpdateUserProfile for ID: %d", id)
	now := time.Now()

	queryUpdate := `UPDATE users 
	          SET username = COALESCE(@p1, username), 
	              email = COALESCE(@p2, email), 
	              password_hash = COALESCE(@p3, password_hash),
	              updated_at = @p4 
	          WHERE id = @p5 AND deleted_at IS NULL`

	_, err := u.db.Exec(queryUpdate,
		req.Username, // @p1
		req.Email,    // @p2
		req.Password, // @p3
		now,          // @p4
		id,           // @p5
	)

	if err != nil {
		logger.ErrorLogger.Printf("UpdateUserProfile (Exec) Failed: %v", err)
		return model.User{}, err
	}

	// Lấy dữ liệu mới nhất sau khi sửa
	querySelect := `SELECT id, username, email, role, is_active, created_at, updated_at 
	                FROM users WHERE id = @p1`
	
	var user model.User
	err = u.db.QueryRow(querySelect, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			logger.WarnLogger.Printf("User ID %d not found after update", id)
			return model.User{}, err
		}
		logger.ErrorLogger.Printf("UpdateUserProfile (Select) Failed: %v", err)
		return model.User{}, err
	}

	logger.InfoLogger.Printf("UpdateUserProfile success for ID: %d", id)
	return user, nil
}

// Hàm cập nhật Refresh Token và Expiry
func (u *UserDb) UpdateRefreshToken(id int64, token string, expiry time.Time) error {
	query := `UPDATE users SET refresh_token = @p1, refresh_token_expiry = @p2 WHERE id = @p3`
	_, err := u.db.Exec(query, token, expiry, id)
	return err
}

// Hàm xóa mềm User (soft delete)
func (u *UserDb) DeleteUserById(id int64) error {
	logger.DebugLogger.Println("Starting DeleteUser for ID:", id)
	query := `UPDATE users SET deleted_at = @p1 WHERE id = @p2`

	result, err := u.db.Exec(query, time.Now(), id)
	if err != nil {
		logger.ErrorLogger.Println("Soft DeleteUser failed:", err)
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	logger.InfoLogger.Printf("Soft DeleteUser success, id=%d marked as deleted\n", id)
	return nil
}

// Hàm xóa nhiều User cùng lúc (soft delete)
func (u *UserDb) DeleteManyUsers(ids []int64) error {
	logger.DebugLogger.Printf("Starting DeleteManyUsers for %d users", len(ids))

	// 1. Bắt đầu Transaction (Đảm bảo tính toàn vẹn: Xóa hết hoặc không xóa gì cả)
	tx, err := u.db.Begin()
	if err != nil {
		logger.ErrorLogger.Printf("Failed to begin transaction: %v", err)
		return err
	}

	// 2. Chuẩn bị câu lệnh SQL (Prepare Statement)
	// Cách này giúp SQL Server compile câu lệnh 1 lần, chạy nhiều lần -> Rất nhanh
	query := `UPDATE users SET deleted_at = @p1 WHERE id = @p2`
	stmt, err := tx.Prepare(query)
	if err != nil {
		tx.Rollback() // Lỗi thì hoàn tác
		logger.ErrorLogger.Printf("Failed to prepare statement: %v", err)
		return err
	}
	defer stmt.Close()

	now := time.Now()

	// 3. Duyệt qua danh sách ID và thực thi
	for _, id := range ids {
		_, err := stmt.Exec(now, id)
		if err != nil {
			tx.Rollback() // Gặp lỗi ở bất kỳ user nào -> Hoàn tác toàn bộ
			logger.ErrorLogger.Printf("Failed to delete user ID %d: %v", id, err)
			return err
		}
	}

	// 4. Commit (Lưu thay đổi)
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
    
    // Set refresh_token và expiry về NULL
    query := `UPDATE users SET refresh_token = NULL, refresh_token_expiry = NULL WHERE id = @p1`
    
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
              WHERE refresh_token = @p1 AND refresh_token_expiry > GETDATE()`
    
    var user model.User
    err := u.db.QueryRow(query, refreshToken).Scan(
        &user.ID, &user.Username, &user.Email, &user.Role, &user.IsActive,
    )
    
    if err != nil {
        logger.WarnLogger.Printf("Refresh token invalid or expired: %v", err)
        return model.User{}, err
    }
    return user, nil
}