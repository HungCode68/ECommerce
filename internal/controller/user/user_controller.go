package user

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/repository/user"
	"net"
	"net/http"
	"net/smtp"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type userController struct {
	UserRepo user.UserRepo
}

type googleTokenInfoResponse struct {
	Iss           string `json:"iss"`
	Aud           string `json:"aud"`
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	ExpiresAt     string `json:"exp"`
}

const (
	emailVerificationOTPExpiry   = 5 * time.Minute
	emailVerificationOTPCooldown = 60 * time.Second
)

func NewUserController(userRepo user.UserRepo) UserController {
	return &userController{
		UserRepo: userRepo,
	}
}

func toUserProfileResponse(user model.User) model.UserProfileResponse {
	return model.UserProfileResponse{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		Role:          user.Role,
		IsActive:      user.IsActive,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
		LastActiveAt:  user.LastActiveAt,
	}
}

func toAdminUserResponse(user model.User) model.AdminUserResponse {
	return model.AdminUserResponse{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		Role:          user.Role,
		IsActive:      user.IsActive,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
		LastActiveAt:  user.LastActiveAt,
		DeletedAt:     user.DeletedAt,
	}
}

// Hàm Register để đăng ký user mới
func (c *userController) Register(req model.RegisterRequest) (model.UserProfileResponse, error) {
	logger.InfoLogger.Printf("Bắt đầu đăng ký user mới: %s", req.Username)

	// Kiểm tra User đã tồn tại chưa (Check Username hoặc Email)
	existingUser, _ := c.UserRepo.GetUserByIdentifier(req.Username)
	if existingUser.ID != 0 {
		return model.UserProfileResponse{}, errors.New("tên đăng nhập đã tồn tại")
	}
	existingEmail, _ := c.UserRepo.GetUserByIdentifier(req.Email)
	if existingEmail.ID != 0 {
		return model.UserProfileResponse{}, errors.New("email đã tồn tại")
	}

	// Mã hóa mật khẩu (Hashing)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi hash password: %v", err)
		return model.UserProfileResponse{}, err
	}

	// Map từ Request -> Model User (Entity)
	newUser := model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: stringPtr(string(hashedPassword)),
		AuthProvider: "local",
		Role:         "user",
		IsActive:     true,
	}

	// Gọi Repo để lưu xuống DB
	createdUser, err := c.UserRepo.CreateUser(newUser)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi khi tạo user trong DB: %v", err)
		return model.UserProfileResponse{}, err
	}

	// Chuyển đổi sang Response
	logger.InfoLogger.Printf("Đăng ký thành công user ID: %d", createdUser.ID)
	return toUserProfileResponse(createdUser), nil
}

// Hàm Login để xác thực user
func (c *userController) Login(req model.LoginRequest) (model.LoginResponse, error) {
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

	if user.PasswordHash == nil {
		if user.AuthProvider == "google" {
			return model.LoginResponse{}, errors.New("tài khoản này chỉ hỗ trợ đăng nhập bằng Google")
		}
		return model.LoginResponse{}, errors.New("tài khoản chưa được cấu hình mật khẩu")
	}

	//  So sánh mật khẩu
	err = bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password))
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
	activityAt := time.Now()
	refreshTokenExpiry := activityAt.Add(7 * 24 * time.Hour)
	err = c.UserRepo.UpdateRefreshToken(user.ID, refreshToken, refreshTokenExpiry)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi lưu refresh token: %v", err)
		return model.LoginResponse{}, err
	}

	//  Trả kết quả
	user.LastActiveAt = &activityAt

	response := model.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         toUserProfileResponse(user),
	}

	logger.InfoLogger.Printf("Login thành công: %s", user.Username)
	return response, nil
}

func (c *userController) GoogleLogin(req model.GoogleLoginRequest) (model.LoginResponse, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	if clientID == "" {
		return model.LoginResponse{}, errors.New("server chưa cấu hình GOOGLE_CLIENT_ID")
	}

	tokenInfo, err := verifyGoogleIDToken(context.Background(), req.Credential, clientID)
	if err != nil {
		logger.WarnLogger.Printf("Google token verification failed: %v", err)
		return model.LoginResponse{}, errors.New("google credential không hợp lệ")
	}

	if !parseGoogleBool(tokenInfo.EmailVerified) {
		return model.LoginResponse{}, errors.New("email Google chưa được xác minh")
	}

	userData, err := c.resolveGoogleUser(tokenInfo)
	if err != nil {
		return model.LoginResponse{}, err
	}

	accessToken, refreshToken, err := generateTokens(userData.ID, userData.Role)
	if err != nil {
		return model.LoginResponse{}, err
	}

	activityAt := time.Now()
	refreshTokenExpiry := activityAt.Add(7 * 24 * time.Hour)
	if err := c.UserRepo.UpdateRefreshToken(userData.ID, refreshToken, refreshTokenExpiry); err != nil {
		return model.LoginResponse{}, err
	}

	userData.LastActiveAt = &activityAt
	return model.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         toUserProfileResponse(userData),
	}, nil
}

func (c *userController) SendEmailVerificationOTP(req model.SendEmailVerificationOTPRequest) error {
	userData, err := c.UserRepo.GetUserByIdentifier(req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("email chưa được đăng ký")
		}
		return err
	}

	if userData.DeletedAt != nil {
		return errors.New("tài khoản này đã bị xóa")
	}
	if !userData.IsActive {
		return errors.New("tài khoản này đã bị khóa")
	}
	if userData.EmailVerified {
		return errors.New("email này đã được xác minh")
	}

	latestOTP, err := c.UserRepo.GetLatestPendingEmailVerificationOTP(userData.ID, userData.Email)
	if err == nil && time.Since(latestOTP.CreatedAt) < emailVerificationOTPCooldown {
		remaining := int((emailVerificationOTPCooldown - time.Since(latestOTP.CreatedAt)).Seconds())
		if remaining < 1 {
			remaining = 1
		}
		return fmt.Errorf("vui lòng chờ %d giây trước khi gửi lại OTP", remaining)
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	otpCode, err := generateOTPCode()
	if err != nil {
		return err
	}
	otpHash := hashOTP(otpCode)
	expiresAt := time.Now().Add(emailVerificationOTPExpiry)

	if err := c.UserRepo.CreateEmailVerificationOTP(userData.ID, userData.Email, otpHash, expiresAt); err != nil {
		return err
	}

	if err := sendVerificationEmail(userData.Email, otpCode); err != nil {
		logger.ErrorLogger.Printf("Failed to send verification email to %s: %v", userData.Email, err)
		return errors.New("không thể gửi email OTP, kiểm tra cấu hình SMTP")
	}

	return nil
}

func (c *userController) VerifyEmailVerificationOTP(req model.VerifyEmailVerificationOTPRequest) error {
	userData, err := c.UserRepo.GetUserByIdentifier(req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("email chưa được đăng ký")
		}
		return err
	}

	if userData.EmailVerified {
		return errors.New("email này đã được xác minh")
	}

	otpHash := hashOTP(req.OTP)
	otpRecord, err := c.UserRepo.GetPendingEmailVerificationOTPByHash(userData.ID, userData.Email, otpHash)
	if err != nil {
		if latestOTP, latestErr := c.UserRepo.GetLatestPendingEmailVerificationOTP(userData.ID, userData.Email); latestErr == nil {
			_ = c.UserRepo.IncrementEmailVerificationAttempts(latestOTP.ID)
		}
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("otp không đúng hoặc đã hết hạn")
		}
		return err
	}

	if err := c.UserRepo.MarkEmailVerified(userData.ID); err != nil {
		return err
	}
	if err := c.UserRepo.ConsumeEmailVerificationOTP(otpRecord.ID); err != nil {
		return err
	}

	return nil
}

// Hàm Logout: Hủy refresh token của user
func (c *userController) Logout(userID int64) error {
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
func (c *userController) CreateAdmin(req model.RegisterRequest) (model.AdminUserResponse, error) {
	logger.InfoLogger.Printf("ADMIN đang tạo tài khoản Admin mới: %s", req.Username)

	existingUser, _ := c.UserRepo.GetUserByIdentifier(req.Username)
	if existingUser.ID != 0 {
		return model.AdminUserResponse{}, errors.New("tên đăng nhập đã tồn tại")
	}

	existingEmail, _ := c.UserRepo.GetUserByIdentifier(req.Email)
	if existingEmail.ID != 0 {
		return model.AdminUserResponse{}, errors.New("email đã tồn tại")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi hash password: %v", err)
		return model.AdminUserResponse{}, err
	}

	newAdmin := model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: stringPtr(string(hashedPassword)),
		AuthProvider: "local",
		Role:         "admin",
		IsActive:     true,
	}

	// Gọi Repo lưu
	created, err := c.UserRepo.CreateUser(newAdmin)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi tạo admin: %v", err)
		return model.AdminUserResponse{}, err
	}

	// Map sang Response
	return toAdminUserResponse(created), nil
}

// Hàm lấy tất cả Users
func (c *userController) GetAllUsers() ([]model.AdminUserResponse, error) {
	logger.InfoLogger.Println("Bắt đầu lấy danh sách Users")
	users, err := c.UserRepo.GetAllUsers()
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi lấy danh sách user: %v", err)
		return nil, err
	}
	var response []model.AdminUserResponse
	for _, u := range users {
		response = append(response, toAdminUserResponse(u))
	}
	return response, nil
}

// Hàm lấy chi tiết user theo ID
func (c *userController) GetUserByID(id int64) (model.AdminUserResponse, error) {
	logger.InfoLogger.Printf("Lấy chi tiết user ID: %d", id)

	// Gọi Repo
	user, err := c.UserRepo.GetUserByID(id)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi lấy chi tiết user: %v", err)
		return model.AdminUserResponse{}, err
	}

	return toAdminUserResponse(user), nil
}

// Hàm tìm kiếm user theo từ khóa
func (c *userController) SearchUsers(filter model.UserFilter) ([]model.AdminUserResponse, int, error) {
	logger.InfoLogger.Printf("Controller: Searching users with Filter: %+v", filter)
	// Gọi Repo
	users, total, err := c.UserRepo.SearchUsers(filter)
	if err != nil {
		logger.ErrorLogger.Printf("Controller: Failed to search users. Error: %v", err)
		return nil, 0, err
	}

	// Map sang Response (AdminUserResponse)
	var response []model.AdminUserResponse
	for _, u := range users {
		response = append(response, toAdminUserResponse(u))
	}
	logger.InfoLogger.Printf("Controller: SearchUsers success. Returning %d users (Total found in DB: %d)", len(response), total)
	return response, total, nil
}

// Hàm cập nhật thông tin user
func (c *userController) UpdateUser(id int64, req model.AdminUpdateUserRequest) (model.AdminUserResponse, error) {
	logger.InfoLogger.Printf("Cập nhật user ID: %d", id)

	updatedUser, err := c.UserRepo.UpdateUser(id, req)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi update user: %v", err)
		return model.AdminUserResponse{}, err
	}

	return toAdminUserResponse(updatedUser), nil
}

// Hàm User tự cập nhật thông tin cá nhân
func (c *userController) UpdateUserProfile(id int64, req model.UserUpdateProfileRequest) (model.UserProfileResponse, error) {
	logger.InfoLogger.Printf("User ID %d yêu cầu cập nhật profile", id)

	// Kiểm tra trùng Username (Nếu có yêu cầu đổi username)
	if req.Username != nil {
		existingUser, _ := c.UserRepo.GetUserByIdentifier(*req.Username)
		if existingUser.ID != 0 && existingUser.ID != id {
			return model.UserProfileResponse{}, errors.New("tên đăng nhập đã được sử dụng")
		}
	}

	//Kiểm tra trùng Email (Nếu có yêu cầu đổi email)
	if req.Email != nil {
		existingEmail, _ := c.UserRepo.GetUserByIdentifier(*req.Email)
		if existingEmail.ID != 0 && existingEmail.ID != id {
			return model.UserProfileResponse{}, errors.New("email đã được sử dụng")
		}
	}

	//Hash Password (Nếu có yêu cầu đổi pass)
	if req.Password != nil {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return model.UserProfileResponse{}, err
		}
		hashedString := string(hashedPassword)
		req.Password = &hashedString
	}

	// Gọi Repo update
	updatedUser, err := c.UserRepo.UpdateUserProfile(id, req)
	if err != nil {
		return model.UserProfileResponse{}, err
	}

	// Trả về kết quả
	return toUserProfileResponse(updatedUser), nil
}

// Hàm User tự xóa tài khoản (Xóa mềm chính mình)
func (c *userController) DeleteMyAccount(id int64) error {
	logger.WarnLogger.Printf("User ID %d yêu cầu tự xóa tài khoản", id)

	err := c.UserRepo.DeleteSoftUsers([]int64{id})
	if err != nil {
		return err
	}

	return nil
}

// Hàm xóa user
// func (c *userController) DeleteUserById(id int64) error {
// 	logger.WarnLogger.Printf("Xóa user ID: %d", id)
// 	err := c.UserRepo.DeleteManyUsers([]int64{id})
// 	if err != nil {
// 		logger.ErrorLogger.Printf("Lỗi xóa user: %v", err)
// 		return err
// 	}
// 	logger.WarnLogger.Printf("Xóa người dùng ID %d thành công", id)
// 	return nil

// }

// Hàm xóa nhiều user cùng lúc
func (c *userController) DeleteSoftUsers(req model.AdminDeleteManyUsersRequest) error {
	// Gọi Repo
	logger.WarnLogger.Printf("Admin yêu cầu xóa %d users", len(req.IDs))
	return c.UserRepo.DeleteSoftUsers(req.IDs)
}

// Hàm bỏ chặn nhiều user cùng lúc
func (c *userController) RestoreSoftUsers(req model.AdminDeleteManyUsersRequest) error {
	logger.WarnLogger.Printf("Admin yêu cầu bỏ chặn %d users", len(req.IDs))
	return c.UserRepo.RestoreSoftUsers(req.IDs)
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
		Subject:   strconv.Itoa(int(userID)),
	}
	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err := refreshTokenObj.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

// Hàm Refresh Token
func (c *userController) RefreshToken(req model.RefreshTokenRequest) (model.RefreshTokenResponse, error) {
	logger.InfoLogger.Println("Yêu cầu làm mới Token")

	// Verify chữ ký JWT trước khi tin token
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	parsed, err := jwt.ParseWithClaims(req.RefreshToken, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("thuật toán ký không hợp lệ")
		}
		return jwtSecret, nil
	})
	if err != nil || !parsed.Valid {
		logger.WarnLogger.Printf("Refresh token không hợp lệ: %v", err)
		return model.RefreshTokenResponse{}, errors.New("refresh token không hợp lệ hoặc đã hết hạn")
	}

	// Tìm User đang giữ token này (đảm bảo token chưa bị revoke)
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

func (c *userController) resolveGoogleUser(tokenInfo googleTokenInfoResponse) (model.User, error) {
	userData, err := c.UserRepo.GetUserByProviderID("google", tokenInfo.Sub)
	switch {
	case err == nil:
		if userData.DeletedAt != nil {
			return model.User{}, errors.New("tài khoản này đã bị xóa")
		}
		if !userData.IsActive {
			return model.User{}, errors.New("tài khoản này đã bị khóa")
		}
		return userData, nil
	case !errors.Is(err, sql.ErrNoRows):
		return model.User{}, err
	}

	existingUser, err := c.UserRepo.GetUserByIdentifier(tokenInfo.Email)
	switch {
	case err == nil:
		if existingUser.DeletedAt != nil {
			return model.User{}, errors.New("tài khoản này đã bị xóa")
		}
		if !existingUser.IsActive {
			return model.User{}, errors.New("tài khoản này đã bị khóa")
		}
		return c.UserRepo.LinkGoogleAccount(existingUser.ID, tokenInfo.Sub, optionalString(tokenInfo.Picture), true)
	case !errors.Is(err, sql.ErrNoRows):
		return model.User{}, err
	}

	username, err := c.generateUniqueUsername(tokenInfo.Name, tokenInfo.Email)
	if err != nil {
		return model.User{}, err
	}

	newUser := model.User{
		Username:       username,
		Email:          tokenInfo.Email,
		AuthProvider:   "google",
		ProviderUserID: stringPtr(tokenInfo.Sub),
		EmailVerified:  true,
		AvatarURL:      optionalString(tokenInfo.Picture),
		Role:           "user",
		IsActive:       true,
	}

	return c.UserRepo.CreateUser(newUser)
}

func (c *userController) generateUniqueUsername(name string, email string) (string, error) {
	base := sanitizeUsername(name)
	if base == "" {
		localPart := strings.Split(email, "@")[0]
		base = sanitizeUsername(localPart)
	}
	if len(base) < 3 {
		base += "shopvn"
		base = sanitizeUsername(base)
	}
	if len(base) > 24 {
		base = base[:24]
	}

	candidate := base
	for attempt := 0; attempt < 1000; attempt++ {
		existingUser, err := c.UserRepo.GetUserByIdentifier(candidate)
		if errors.Is(err, sql.ErrNoRows) {
			return candidate, nil
		}
		if err != nil {
			return "", err
		}
		if existingUser.ID == 0 {
			return candidate, nil
		}
		candidate = base + strconv.Itoa(attempt+1)
		if len(candidate) > 30 {
			candidate = candidate[:30]
		}
	}

	return "", errors.New("không thể tạo username khả dụng từ tài khoản Google")
}

func sanitizeUsername(value string) string {
	nonAlphaNum := regexp.MustCompile(`[^a-z0-9]+`)
	sanitized := strings.ToLower(value)
	sanitized = nonAlphaNum.ReplaceAllString(sanitized, "")
	return sanitized
}

func verifyGoogleIDToken(ctx context.Context, credential string, clientID string) (googleTokenInfoResponse, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://oauth2.googleapis.com/tokeninfo?id_token="+credential,
		nil,
	)
	if err != nil {
		return googleTokenInfoResponse{}, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return googleTokenInfoResponse{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return googleTokenInfoResponse{}, errors.New("google tokeninfo rejected credential")
	}

	var payload googleTokenInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return googleTokenInfoResponse{}, err
	}

	if payload.Aud != clientID {
		return googleTokenInfoResponse{}, errors.New("google aud mismatch")
	}
	if payload.Iss != "accounts.google.com" && payload.Iss != "https://accounts.google.com" {
		return googleTokenInfoResponse{}, errors.New("google iss mismatch")
	}
	if payload.Sub == "" || payload.Email == "" {
		return googleTokenInfoResponse{}, errors.New("google token missing required claims")
	}

	return payload, nil
}

func parseGoogleBool(value string) bool {
	return strings.EqualFold(value, "true")
}

func optionalString(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func stringPtr(value string) *string {
	return &value
}

func generateOTPCode() (string, error) {
	var buf [6]byte
	for i := range buf {
		randomByte := []byte{0}
		if _, err := rand.Read(randomByte); err != nil {
			return "", err
		}
		buf[i] = '0' + (randomByte[0] % 10)
	}
	return string(buf[:]), nil
}

func hashOTP(otp string) string {
	sum := sha256.Sum256([]byte(otp))
	return fmt.Sprintf("%x", sum[:])
}

func sendVerificationEmail(toEmail string, otpCode string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUsername := os.Getenv("SMTP_USERNAME")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	smtpFrom := os.Getenv("SMTP_FROM")

	if smtpHost == "" || smtpPort == "" || smtpUsername == "" || smtpPassword == "" || smtpFrom == "" {
		return errors.New("missing SMTP env config")
	}

	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, smtpHost)
	subject := "Mã OTP xác minh email"
	body := fmt.Sprintf(
		"Xin chao,\r\n\r\nMa OTP xac minh email cua ban la: %s\r\nMa nay co hieu luc trong 5 phut.\r\n\r\nNeu ban khong yeu cau, hay bo qua email nay.\r\n",
		otpCode,
	)
	message := []byte(
		fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
			smtpFrom, toEmail, subject, body),
	)

	addr := net.JoinHostPort(smtpHost, smtpPort)
	return smtp.SendMail(addr, auth, smtpFrom, []string{toEmail}, message)
}
