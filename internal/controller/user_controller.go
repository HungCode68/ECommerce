package controller

import (
	"errors"
	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/repository"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct {
	UserRepo repository.UserRepo
}

func NewUserController(userRepo repository.UserRepo) *UserController {
	return &UserController{
		UserRepo: userRepo,
	}
}

// Hàm Register để đăng ký user mới
func (c *UserController) Register(req model.RegisterRequest) (model.UserResponse, error) {
	logger.InfoLogger.Printf("Bắt đầu đăng ký user mới: %s", req.Username)

	// Kiểm tra User đã tồn tại chưa (Check Username hoặc Email)
	existingUser, _ := c.UserRepo.GetUserByIdentifier(req.Username)
	if existingUser.ID != 0 {
		return model.UserResponse{}, errors.New("tên đăng nhập đã tồn tại")
	}
	existingEmail, _ := c.UserRepo.GetUserByIdentifier(req.Email)
	if existingEmail.ID != 0 {
		return model.UserResponse{}, errors.New("email đã tồn tại")
	}

	// Mã hóa mật khẩu (Hashing)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi hash password: %v", err)
		return model.UserResponse{}, err
	}

	// Map từ Request -> Model User (Entity)
	newUser := model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "user",
		IsActive:     true,
	}

	// Gọi Repo để lưu xuống DB
	createdUser, err := c.UserRepo.CreateUser(newUser)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi khi tạo user trong DB: %v", err)
		return model.UserResponse{}, err
	}

	// Chuyển đổi sang Response
	res := model.UserResponse{
		ID:        createdUser.ID,
		Username:  createdUser.Username,
		Email:     createdUser.Email,
		Role:      createdUser.Role,
		IsActive:  createdUser.IsActive,
		CreatedAt: createdUser.CreatedAt,
	}

	logger.InfoLogger.Printf("Đăng ký thành công user ID: %d", createdUser.ID)
	return res, nil
}

// Hàm Login để xác thực user
func (c *UserController) Login(req model.LoginRequest) (model.LoginResponse, error) {
	logger.InfoLogger.Printf("Yêu cầu login từ: %s", req.Identifier)

	//  Tìm user trong DB
	user, err := c.UserRepo.GetUserByIdentifier(req.Identifier)
	if err != nil {
		logger.ErrorLogger.Printf("Login thất bại (User not found): %v", err)
		return model.LoginResponse{}, errors.New("tài khoản hoặc mật khẩu không đúng")
	}

	//  Check nếu user bị xóa
	if user.DeletedAt != nil {
		logger.WarnLogger.Printf("Login thất bại (User deleted) cho user: %s", user.Username)
		return model.LoginResponse{}, errors.New("tài khoản này đã bị xóa")
	}

	//  Check khóa
	if !user.IsActive {
		return model.LoginResponse{}, errors.New("tài khoản này đã bị khóa")
	}

	//  So sánh mật khẩu
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		logger.WarnLogger.Printf("Login thất bại (Sai pass) cho user: %s", user.Username)
		return model.LoginResponse{}, errors.New("tài khoản hoặc mật khẩu không đúng")
	}

	//  Tạo Token
	accessToken, refreshToken, err := generateTokens(user.ID, user.Role)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi tạo token: %v", err)
		return model.LoginResponse{}, err
	}

	//  Lưu Refresh Token
	refreshTokenExpiry := time.Now().Add(7 * 24 * time.Hour)
	err = c.UserRepo.UpdateRefreshToken(user.ID, refreshToken, refreshTokenExpiry)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi lưu refresh token: %v", err)
		return model.LoginResponse{}, err
	}

	//  Trả kết quả
	response := model.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: model.UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Role:      user.Role,
			IsActive:  user.IsActive,
			CreatedAt: user.CreatedAt,
		},
	}

	logger.InfoLogger.Printf("Login thành công: %s", user.Username)
	return response, nil
}

// Hàm Logout: Hủy refresh token của user
func (c *UserController) Logout(userID int64) error {
	logger.InfoLogger.Printf("User ID %d yêu cầu đăng xuất", userID)

	// Gọi Repo để xóa token trong DB
	err := c.UserRepo.RevokeRefreshToken(userID)
	if err != nil {
		return err
	}

	logger.InfoLogger.Printf("User ID %d đăng xuất thành công", userID)
	return nil
}

// Hàm CreateAdmin để Admin tạo tài khoản Admin mới
func (c *UserController) CreateAdmin(req model.RegisterRequest) (model.UserResponse, error) {
	logger.InfoLogger.Printf("ADMIN đang tạo tài khoản Admin mới: %s", req.Username)

	existingUser, _ := c.UserRepo.GetUserByIdentifier(req.Username)
	if existingUser.ID != 0 {
		return model.UserResponse{}, errors.New("tên đăng nhập đã tồn tại")
	}

	existingEmail, _ := c.UserRepo.GetUserByIdentifier(req.Email)
	if existingEmail.ID != 0 {
		return model.UserResponse{}, errors.New("email đã tồn tại")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi hash password: %v", err)
		return model.UserResponse{}, err
	}

	newAdmin := model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "admin",
		IsActive:     true,
	}

	// Gọi Repo lưu
	createdAdmin, err := c.UserRepo.CreateUser(newAdmin)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi tạo admin: %v", err)
		return model.UserResponse{}, err
	}

	// Map sang Response
	res := model.UserResponse{
		ID:        createdAdmin.ID,
		Username:  createdAdmin.Username,
		Email:     createdAdmin.Email,
		Role:      createdAdmin.Role,
		IsActive:  createdAdmin.IsActive,
		CreatedAt: createdAdmin.CreatedAt,
	}

	return res, nil
}

// Hàm lấy tất cả Users
func (c *UserController) GetAllUsers() ([]model.UserResponse, error) {
	logger.InfoLogger.Println("Bắt đầu lấy danh sách Users")
	users, err := c.UserRepo.GetAllUser()
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi lấy danh sách user: %v", err)
		return nil, err
	}
	return users, nil
}

// Hàm lấy chi tiết user theo ID
func (c *UserController) GetUserByID(id int64) (model.UserResponse, error) {
	logger.InfoLogger.Printf("Lấy chi tiết user ID: %d", id)

	// Gọi Repo
	user, err := c.UserRepo.GetUserByID(id)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi lấy chi tiết user: %v", err)
		return model.UserResponse{}, err
	}

	return user, nil
}

// Hàm tìm kiếm user theo từ khóa
func (c *UserController) SearchUsers(keyword string) ([]model.UserResponse, error) {
	logger.InfoLogger.Printf("Tìm kiếm user với từ khóa: %s", keyword)
	users, err := c.UserRepo.SearchUsers(keyword)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi tìm kiếm user: %v", err)
		return nil, err
	}
	return users, nil
}

// Hàm cập nhật thông tin user
func (c *UserController) UpdateUser(id int64, req model.UpdateUserRequest) (model.UserResponse, error) {
	logger.InfoLogger.Printf("Cập nhật user ID: %d", id)

	updatedUser, err := c.UserRepo.UpdateUser(id, req)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi update user: %v", err)
		return model.UserResponse{}, err
	}

	res := model.UserResponse{
		ID:        updatedUser.ID,
		Username:  updatedUser.Username,
		Email:     updatedUser.Email,
		Role:      updatedUser.Role,
		IsActive:  updatedUser.IsActive,
		CreatedAt: updatedUser.CreatedAt,
	}

	return res, nil
}

// Hàm User tự cập nhật thông tin cá nhân
func (c *UserController) UpdateUserProfile(id int64, req model.UpdateProfileRequest) (model.UserResponse, error) {
	logger.InfoLogger.Printf("User ID %d yêu cầu cập nhật profile", id)

	// Kiểm tra trùng Username (Nếu có yêu cầu đổi username)
	if req.Username != nil {
		existingUser, _ := c.UserRepo.GetUserByIdentifier(*req.Username)
		if existingUser.ID != 0 && existingUser.ID != id {
			return model.UserResponse{}, errors.New("tên đăng nhập đã được sử dụng")
		}
	}

	//Kiểm tra trùng Email (Nếu có yêu cầu đổi email)
	if req.Email != nil {
		existingEmail, _ := c.UserRepo.GetUserByIdentifier(*req.Email)
		if existingEmail.ID != 0 && existingEmail.ID != id {
			return model.UserResponse{}, errors.New("email đã được sử dụng")
		}
	}

	//Hash Password (Nếu có yêu cầu đổi pass)
	if req.Password != nil {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return model.UserResponse{}, err
		}
		hashedString := string(hashedPassword)
		req.Password = &hashedString
	}

	// Gọi Repo update
	updatedUser, err := c.UserRepo.UpdateUserProfile(id, req)
	if err != nil {
		return model.UserResponse{}, err
	}

	// Trả về kết quả
	res := model.UserResponse{
		ID:        updatedUser.ID,
		Username:  updatedUser.Username,
		Email:     updatedUser.Email,
		Role:      updatedUser.Role,
		IsActive:  updatedUser.IsActive,
		CreatedAt: updatedUser.CreatedAt,
		UpdatedAt: updatedUser.UpdatedAt,
	}

	return res, nil
}

// Hàm User tự xóa tài khoản (Xóa mềm chính mình)
func (c *UserController) DeleteMyAccount(id int64) error {
	logger.WarnLogger.Printf("User ID %d yêu cầu tự xóa tài khoản", id)

	err := c.UserRepo.DeleteUserById(id)
	if err != nil {
		return err
	}

	return nil
}

// Hàm xóa user
func (c *UserController) DeleteUserById(id int64) error {
	logger.WarnLogger.Printf("Xóa user ID: %d", id)
	err := c.UserRepo.DeleteUserById(id)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi xóa user: %v", err)
		return err
	}
	logger.WarnLogger.Printf("Xóa sinh viên ID %d thành công", id)
	return nil

}

// Hàm xóa nhiều user cùng lúc
func (c *UserController) DeleteManyUsers(req model.DeleteManyRequest) error {
	// Gọi Repo
	logger.WarnLogger.Printf("Admin yêu cầu xóa %d users", len(req.IDs))
	return c.UserRepo.DeleteManyUsers(req.IDs)
}

// Hàm tạo Access Token và Refresh Token
func generateTokens(userID int64, role string) (string, string, error) {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	// Access Token (15 phút)
	claims := model.MyClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			Issuer:    "my-ecommerce-app",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	// Refresh Token (7 ngày)
	refreshClaims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		Subject:   string(rune(userID)),
	}
	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err := refreshTokenObj.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

// Hàm Refresh Token 
func (c *UserController) RefreshToken(req model.RefreshTokenRequest) (model.RefreshTokenResponse, error) {
	logger.InfoLogger.Println("Yêu cầu làm mới Token")

	// Tìm User đang giữ token này
	user, err := c.UserRepo.GetUserByRefreshToken(req.RefreshToken)
	if err != nil {
		return model.RefreshTokenResponse{}, errors.New("refresh token không hợp lệ hoặc đã hết hạn")
	}

	if !user.IsActive {
		return model.RefreshTokenResponse{}, errors.New("tài khoản đã bị khóa")
	}

	// TẠO CẶP TOKEN MỚI 
	newAccessToken, newRefreshToken, err := generateTokens(user.ID, user.Role)
	if err != nil {
		return model.RefreshTokenResponse{}, err
	}

	//  Lưu Token mới vào DB 
	newExpiry := time.Now().Add(7 * 24 * time.Hour)
	err = c.UserRepo.UpdateRefreshToken(user.ID, newRefreshToken, newExpiry)
	if err != nil {
		return model.RefreshTokenResponse{}, err
	}

	return model.RefreshTokenResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}
