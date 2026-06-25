package audit

import (
	"golang/internal/model"
)

type AuditController interface {
	GetLogs(page, limit int, entityType, action string) ([]model.AdminAuditLogResponse, int, error)
	LogAction(adminID int64, action, entityType string, entityID string, oldValues, newValues *string) error
}
