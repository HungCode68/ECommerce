package router

import (
	"golang/internal/handler/notification"
	"golang/internal/middleware"
	"net/http"
)

func NewNotificationRouter(mux *http.ServeMux, h notification.NotificationHandler) http.Handler {
	userGroup := newGroup(mux, "/api/notifications", middleware.AuthMiddleware)

	userGroup.HandleFunc("GET", "", h.GetNotificationsHandler)
	userGroup.HandleFunc("GET", "/unread-count", h.GetUnreadCountHandler)
	userGroup.HandleFunc("PUT", "/read-all", h.MarkAllAsReadHandler)
	userGroup.HandleFunc("PUT", "/{id}/read", h.MarkAsReadHandler)

	return mux
}
