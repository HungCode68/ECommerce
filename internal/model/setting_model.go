package model

import "time"

type SystemSetting struct {
	Key       string    `db:"key" json:"key"`
	Value     string    `db:"value" json:"value"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type UpdateSettingsRequest struct {
	ZaloLink string `json:"zalo_link" validate:"required"`
	Hotline  string `json:"hotline" validate:"required"`
}

type PublicSettingsResponse struct {
	ZaloLink string `json:"zalo_link"`
	Hotline  string `json:"hotline"`
}
