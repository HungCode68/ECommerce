package router

import (
	"net/http"
	"golang/internal/handler/audit"
	"golang/internal/middleware"
)

func NewAuditRouter(mux *http.ServeMux, h audit.AuditHandler) {
	adminGroup := newGroup(mux, "/api/admin/audit-logs", middleware.AdminOnlyMiddleware)
	adminGroup.HandleFunc("GET", "", h.GetLogs)
}
