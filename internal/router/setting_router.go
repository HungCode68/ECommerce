package router

import (
	settingHandler "golang/internal/handler/setting"
	"golang/internal/middleware"
	"net/http"
)

func NewSettingRouter(mux *http.ServeMux, h settingHandler.SettingHandler) http.Handler {
	adminGroup := newGroup(mux, "/api/admin", middleware.AdminOnlyMiddleware)
	adminGroup.HandleFunc("GET", "/settings", h.GetSettings)
	adminGroup.HandleFunc("PUT", "/settings", h.UpdateSettings)

	userGroup := newGroup(mux, "/api")
	userGroup.HandleFunc("GET", "/settings", h.GetSettings)

	return mux
}
