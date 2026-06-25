package audit

import "golang/internal/model"

type AuditRepo interface {
	InsertLog(log model.AdminAuditLog) error
	GetLogs(page, limit int, entityType, action string) ([]model.AdminAuditLog, int, error)
}
