package model

import (
	"time"
)

type AdminAuditLog struct {
	ID         int64      `json:"id"`
	AdminID    int64      `json:"admin_id"`
	AdminName  string     `json:"admin_name,omitempty"` // JOIN from users table
	Action     string     `json:"action"`               // CREATE, UPDATE, DELETE
	EntityType string     `json:"entity_type"`          // USER, SETTING, PRODUCT...
	EntityID   *string    `json:"entity_id,omitempty"`
	OldValues  *string    `json:"old_values,omitempty"` // JSON string
	NewValues  *string    `json:"new_values,omitempty"` // JSON string
	CreatedAt  *time.Time `json:"created_at"`
}

type AdminAuditLogResponse struct {
	ID         int64      `json:"id"`
	AdminID    int64      `json:"admin_id"`
	AdminName  string     `json:"admin_name"`
	Action     string     `json:"action"`
	EntityType string     `json:"entity_type"`
	EntityID   *string    `json:"entity_id"`
	OldValues  string     `json:"old_values"`
	NewValues  string     `json:"new_values"`
	CreatedAt  *time.Time `json:"created_at"`
}
