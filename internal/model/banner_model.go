package model

import "time"

type Banner struct {
	ID            int64      `db:"id" json:"id"`
	Title         string     `db:"title" json:"title"`
	ImageURL      string     `db:"image_url" json:"image_url"`
	MobileImageURL *string   `db:"mobile_image_url" json:"mobile_image_url,omitempty"`
	LinkURL       *string    `db:"link_url" json:"link_url,omitempty"`
	Position      string     `db:"position" json:"position"`
	IsActive      bool       `db:"is_active" json:"is_active"`
	SortOrder     int        `db:"sort_order" json:"sort_order"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at" json:"updated_at"`
}

type CreateBannerRequest struct {
	Title          string `json:"title" validate:"required,min=2,max=255"`
	ImageURL       string `json:"image_url" validate:"required,max=500"`
	MobileImageURL string `json:"mobile_image_url" validate:"omitempty,max=500"`
	LinkURL        string `json:"link_url" validate:"omitempty,max=500"`
	Position       string `json:"position" validate:"required,min=2,max=100"`
	IsActive       *bool  `json:"is_active,omitempty"`
	SortOrder      int    `json:"sort_order" validate:"omitempty,gte=0"`
}

type UpdateBannerRequest struct {
	Title          *string `json:"title,omitempty" validate:"omitempty,min=2,max=255"`
	ImageURL       *string `json:"image_url,omitempty" validate:"omitempty,max=500"`
	MobileImageURL *string `json:"mobile_image_url,omitempty" validate:"omitempty,max=500"`
	LinkURL        *string `json:"link_url,omitempty" validate:"omitempty,max=500"`
	Position       *string `json:"position,omitempty" validate:"omitempty,min=2,max=100"`
	IsActive       *bool   `json:"is_active,omitempty"`
	SortOrder      *int    `json:"sort_order,omitempty" validate:"omitempty,gte=0"`
}

