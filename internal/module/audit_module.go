package module

import (
	"database/sql"
	"net/http"

	"golang/internal/controller/audit"
	auditHandler "golang/internal/handler/audit"
	auditRepo "golang/internal/repository/audit"
	"golang/internal/router"
)

func InitAuditModule(db *sql.DB, mux *http.ServeMux) audit.AuditController {
	repo := auditRepo.NewAuditRepo(db)
	controller := audit.NewAuditController(repo)
	handler := auditHandler.NewAuditHandler(controller)

	router.NewAuditRouter(mux, handler)
	
	return controller
}
