package audit

import (
	"golang/internal/model"
	"golang/internal/repository/audit"
)

type auditController struct {
	auditRepo audit.AuditRepo
}

func NewAuditController(auditRepo audit.AuditRepo) AuditController {
	return &auditController{
		auditRepo: auditRepo,
	}
}

func (c *auditController) GetLogs(page, limit int, entityType, action string) ([]model.AdminAuditLogResponse, int, error) {
	logs, total, err := c.auditRepo.GetLogs(page, limit, entityType, action)
	if err != nil {
		return nil, 0, err
	}

	var responses []model.AdminAuditLogResponse
	for _, log := range logs {
		res := model.AdminAuditLogResponse{
			ID:         log.ID,
			AdminID:    log.AdminID,
			AdminName:  log.AdminName,
			Action:     log.Action,
			EntityType: log.EntityType,
			EntityID:   log.EntityID,
			CreatedAt:  log.CreatedAt,
		}
		
		if log.OldValues != nil {
			res.OldValues = *log.OldValues
		} else {
			res.OldValues = "{}"
		}
		
		if log.NewValues != nil {
			res.NewValues = *log.NewValues
		} else {
			res.NewValues = "{}"
		}
		
		responses = append(responses, res)
	}

	return responses, total, nil
}

func (c *auditController) LogAction(adminID int64, action, entityType string, entityID string, oldValues, newValues *string) error {
	var entID *string
	if entityID != "" {
		entID = &entityID
	}
	
	log := model.AdminAuditLog{
		AdminID:    adminID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entID,
		OldValues:  oldValues,
		NewValues:  newValues,
	}
	return c.auditRepo.InsertLog(log)
}
