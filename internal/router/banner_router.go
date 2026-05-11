package router

import (
	bannerHandler "golang/internal/handler/banner"
	"golang/internal/middleware"
	"net/http"
)

func NewBannerRouter(mux *http.ServeMux, h bannerHandler.BannerHandler) http.Handler {
	adminGroup := newGroup(mux, "/api/admin", middleware.AdminOnlyMiddleware)
	adminGroup.HandleFunc("GET", "/banners", h.AdminGetAllBanners)
	adminGroup.HandleFunc("POST", "/banners", h.AdminCreateBanner)
	adminGroup.HandleFunc("PUT", "/banners/{id}", h.AdminUpdateBanner)
	adminGroup.HandleFunc("DELETE", "/banners/{id}", h.AdminDeleteBanner)

	userGroup := newGroup(mux, "/api")
	userGroup.HandleFunc("GET", "/banners", h.UserGetActiveBanners)

	return mux
}

