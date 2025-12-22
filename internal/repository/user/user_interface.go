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
	SearchUsers(keyword string) ([]model.User, error)
	GetUserByIdentifier(identifier string) (model.User, error)
	GetUserByRefreshToken(refreshToken string) (model.User, error)

	// Write Methods
	CreateUser(user model.User) (model.User, error)
	UpdateUser(id int64, req model.AdminUpdateUserRequest) (model.User, error)
	UpdateUserProfile(id int64, req model.UserUpdateProfileRequest) (model.User, error)
	UpdateRefreshToken(id int64, refreshToken string, expiry time.Time) error
	
	// Delete Methods
	DeleteSoftUsers(ids []int64) error
	RevokeRefreshToken(userID int64) error
}