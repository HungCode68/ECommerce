package router

import (
	callbackHandler "golang/internal/handler/callback"
	"golang/internal/middleware"
	"net/http"
)

func NewCallbackRouter(mux *http.ServeMux, h callbackHandler.CallbackHandler) http.Handler {
	adminGroup := newGroup(mux, "/api/admin", middleware.AdminOnlyMiddleware)
	adminGroup.HandleFunc("GET", "/callback-requests", h.AdminGetAll)
	adminGroup.HandleFunc("PUT", "/callback-requests/{id}", h.AdminUpdateStatus)
	adminGroup.HandleFunc("DELETE", "/callback-requests/{id}", h.AdminDelete)

	userGroup := newGroup(mux, "/api")
	userGroup.HandleFunc("POST", "/callback-requests", h.PublicCreate)

	return mux
}
