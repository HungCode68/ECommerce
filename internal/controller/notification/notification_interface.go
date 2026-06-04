package notification

import (
	"context"
	"golang/internal/model"
)

type NotificationController interface {
	GetNotifications(ctx context.Context, userID int64, offset int, limit int) (*model.NotificationListResponse, error)
	MarkAsRead(ctx context.Context, notificationID int64, userID int64) error
	MarkAllAsRead(ctx context.Context, userID int64) error
	GetUnreadCount(ctx context.Context, userID int64) (*model.NotificationUnreadCountResponse, error)
}
