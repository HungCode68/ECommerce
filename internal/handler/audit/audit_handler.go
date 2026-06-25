
package audit

import (
	"encoding/json"
	"net/http"
	"strconv"

	"golang/internal/controller/audit"
	"golang/internal/model"
)

type auditHandler struct {
	auditController audit.AuditController
}

func NewAuditHandler(ac audit.AuditController) AuditHandler {
	return &auditHandler{
		auditController: ac,
	}
}

func (h *auditHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	entityType := r.URL.Query().Get("entity_type")
	action := r.URL.Query().Get("action")

	page := 1
	limit := 10
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	logs, total, err := h.auditController.GetLogs(page, limit, entityType, action)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Lỗi khi lấy danh sách logs: " + err.Error()})
		return
	}

	if logs == nil {
		logs = []model.AdminAuditLogResponse{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"code":    http.StatusOK,
		"message": "Logs retrieved successfully",
		"data":    logs,
		"pagination": map[string]interface{}{
			"total": total,
			"page":  page,
			"limit": limit,
		},
		"errors": nil,
	})
}
