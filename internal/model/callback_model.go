package model

import "time"

type CallbackRequest struct {
	ID          int64     `db:"id" json:"id"`
	PhoneNumber string    `db:"phone_number" json:"phone_number"`
	Status      string    `db:"status" json:"status"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type CreateCallbackRequest struct {
	PhoneNumber string `json:"phone_number" validate:"required,min=8,max=20"`
}

type UpdateCallbackStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=pending completed cancelled"`
}
