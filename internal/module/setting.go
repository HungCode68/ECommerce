package module

import (
	"database/sql"
	settingController "golang/internal/controller/setting"
	settingHandler "golang/internal/handler/setting"
	settingRepo "golang/internal/repository/setting"
	"golang/internal/router"
	"net/http"
)

func InitSettingModule(db *sql.DB, mux *http.ServeMux) {
	repo := settingRepo.NewSettingRepo(db)
	ctrl := settingController.NewSettingController(repo)
	hdl := settingHandler.NewSettingHandler(ctrl)
	router.NewSettingRouter(mux, hdl)
}
