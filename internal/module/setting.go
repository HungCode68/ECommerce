package module

import (
	"database/sql"
	settingController "golang/internal/controller/setting"
	settingHandler "golang/internal/handler/setting"
	settingRepo "golang/internal/repository/setting"
	"golang/internal/controller/audit"
	"golang/internal/router"
	"net/http"
)

func InitSettingModule(db *sql.DB, mux *http.ServeMux, auditCtrl audit.AuditController) {
	repo := settingRepo.NewSettingRepo(db)
	ctrl := settingController.NewSettingController(repo, auditCtrl)
	hdl := settingHandler.NewSettingHandler(ctrl)
	router.NewSettingRouter(mux, hdl)
}
