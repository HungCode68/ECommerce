package module

import (
	"database/sql"
	callbackController "golang/internal/controller/callback"
	callbackHandler "golang/internal/handler/callback"
	callbackRepo "golang/internal/repository/callback"
	"golang/internal/router"
	"net/http"
)

func InitCallbackModule(db *sql.DB, mux *http.ServeMux) {
	repo := callbackRepo.NewCallbackRepo(db)
	ctrl := callbackController.NewCallbackController(repo)
	hdl := callbackHandler.NewCallbackHandler(ctrl)
	router.NewCallbackRouter(mux, hdl)
}
