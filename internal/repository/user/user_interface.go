package user

import (
	"golang/internal/model"
	"time"
)

// UserRepo - Interface định nghĩa các hành động
type UserRepo interface {
	// Read Methods
	GetAllUsers() ([]model.User, error)
	GetUserByID(id int64) (model.User, error)
	SearchUsers(filter model.UserFilter) ([]model.User, int, error)
	GetUserByIdentifier(identifier string) (model.User, error)
	GetUserByProviderID(provider string, providerUserID string) (model.User, error)
	GetUserByRefreshToken(refreshToken string) (model.User, error)
	GetLatestPendingEmailVerificationOTP(userID int64, email string) (model.EmailVerificationOTP, error)
	GetPendingEmailVerificationOTPByHash(userID int64, email string, otpHash string) (model.EmailVerificationOTP, error)

	// Write Methods
	CreateUser(user model.User) (model.User, error)
	UpdateUser(id int64, req model.AdminUpdateUserRequest) (model.User, error)
	UpdateUserProfile(id int64, req model.UserUpdateProfileRequest) (model.User, error)
	UpdateRefreshToken(id int64, refreshToken string, expiry time.Time) error
	LinkGoogleAccount(userID int64, providerUserID string, avatarURL *string, emailVerified bool) (model.User, error)
	LinkProviderAccount(userID int64, provider string, providerUserID string, avatarURL *string, emailVerified bool) (model.User, error)
	CreateEmailVerificationOTP(userID int64, email string, otpHash string, expiresAt time.Time) error
	ConsumeEmailVerificationOTP(id int64) error
	IncrementEmailVerificationAttempts(id int64) error
	MarkEmailVerified(userID int64) error

	// Delete Methods
	DeleteSoftUsers(ids []int64, reason string) error
	RestoreSoftUsers(ids []int64) error
	RevokeRefreshToken(userID int64) error
}
