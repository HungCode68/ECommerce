package notification

import "golang/internal/model"

type NotificationRepository interface {
	Create(notification *model.Notification) error
	GetByUserID(userID int64, offset int, limit int) ([]model.Notification, int64, error)
	MarkAsRead(notificationID int64, userID int64) error
	MarkAllAsRead(userID int64) error
	GetUnreadCount(userID int64) (int64, error)
}
