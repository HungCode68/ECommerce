package module

import (
	"database/sql"
	"golang/internal/controller/notification"
	handler "golang/internal/handler/notification"
	repo "golang/internal/repository/notification"
	"golang/internal/router"
	"net/http"
)

func InitNotificationModule(db *sql.DB, mux *http.ServeMux) {
	notificationRepo := repo.NewNotificationRepo(db)
	notificationController := notification.NewNotificationController(notificationRepo)
	notificationHandler := handler.NewNotificationHandler(notificationController)
	router.NewNotificationRouter(mux, notificationHandler)
}
