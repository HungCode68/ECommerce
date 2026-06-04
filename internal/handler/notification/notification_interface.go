package notification

import "net/http"

type NotificationHandler interface {
	GetNotificationsHandler(w http.ResponseWriter, r *http.Request)
	MarkAsReadHandler(w http.ResponseWriter, r *http.Request)
	MarkAllAsReadHandler(w http.ResponseWriter, r *http.Request)
	GetUnreadCountHandler(w http.ResponseWriter, r *http.Request)
}
