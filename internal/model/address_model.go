package model

import (
	"time"
)

type Address struct {
	ID                int64     `db:"id" json:"id"`
	UserID            int64     `db:"user_id" json:"user_id"`
	Label             string    `db:"label" json:"label"`                       
	RecipientName     string    `db:"recipient_name" json:"recipient_name"`     
	Phone             string    `db:"phone" json:"phone"`                       
	Line1             string    `db:"line1" json:"line1"`                      
	Line2             string    `db:"line2" json:"line2"`                       
	City              string    `db:"city" json:"city"`                         
	State             string    `db:"state" json:"state"`                       
	Country           string    `db:"country" json:"country"`                   
	IsDefaultShipping bool      `db:"is_default_shipping" json:"is_default_shipping"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time `db:"updated_at" json:"updated_at"`
}

//CreateAddressRequest: Dùng khi user thêm địa chỉ mới
type CreateAddressRequest struct {
	Label             string `json:"label" validate:"omitempty,max=50"`
	RecipientName     string `json:"recipient_name" validate:"required,min=2,max=150"`
	Phone             string `json:"phone" validate:"required,min=9,max=20,numeric"`
	Line1             string `json:"line1" validate:"required,max=255"`
	Line2             string `json:"line2" validate:"omitempty,max=255"`
	City              string `json:"city" validate:"required,max=100"`
	State             string `json:"state" validate:"omitempty,max=100"`
	Country           string `json:"country" validate:"required,max=100"`
	IsDefaultShipping bool   `json:"is_default_shipping"`
}

// UpdateAddressRequest: Dùng khi sửa địa chỉ
type UpdateAddressRequest struct {
	Label             *string `json:"label,omitempty" validate:"omitempty,max=50"`
	RecipientName     *string `json:"recipient_name,omitempty" validate:"omitempty,min=2,max=150"`
	Phone             *string `json:"phone,omitempty" validate:"omitempty,min=9,max=20,numeric"`
	Line1             *string `json:"line1,omitempty" validate:"omitempty,max=255"`
	Line2             *string `json:"line2,omitempty" validate:"omitempty,max=255"`
	City              *string `json:"city,omitempty" validate:"omitempty,max=100"`
	State             *string `json:"state,omitempty" validate:"omitempty,max=100"`
	Country           *string `json:"country,omitempty" validate:"omitempty,max=100"`
	IsDefaultShipping *bool   `json:"is_default_shipping,omitempty"`
}

// AddressResponse: Trả về client
type AddressResponse struct {
	ID                int64     `json:"id"`
	UserID            int64     `json:"user_id"`
	Label             string    `json:"label,omitempty"` 
	RecipientName     string    `json:"recipient_name"`
	Phone             string    `json:"phone"`
	Line1             string    `json:"line1"`
	Line2             string    `json:"line2,omitempty"`
	City              string    `json:"city"`
	State             string    `json:"state,omitempty"`
	Country           string    `json:"country"`
	IsDefaultShipping bool      `json:"is_default_shipping"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}