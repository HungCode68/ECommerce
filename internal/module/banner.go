package module

import (
	"database/sql"
	bannerController "golang/internal/controller/banner"
	bannerHandler "golang/internal/handler/banner"
	bannerRepo "golang/internal/repository/banner"
	"golang/internal/router"
	"net/http"
)

func InitBannerModule(db *sql.DB, mux *http.ServeMux) {
	repo := bannerRepo.NewBannerRepo(db)
	ctrl := bannerController.NewBannerController(repo)
	hdl := bannerHandler.NewBannerHandler(ctrl)
	router.NewBannerRouter(mux, hdl)
}

