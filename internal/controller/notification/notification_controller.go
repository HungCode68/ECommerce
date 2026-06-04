package notification

import (
	"context"
	"golang/internal/model"
	repo "golang/internal/repository/notification"
)

type notificationController struct {
	repo repo.NotificationRepository
}

func NewNotificationController(repo repo.NotificationRepository) NotificationController {
	return &notificationController{repo: repo}
}

func (c *notificationController) GetNotifications(ctx context.Context, userID int64, offset int, limit int) (*model.NotificationListResponse, error) {
	notifications, total, err := c.repo.GetByUserID(userID, offset, limit)
	if err != nil {
		return nil, err
	}

	if notifications == nil {
		notifications = []model.Notification{}
	}

	return &model.NotificationListResponse{
		Data: notifications,
		Pagination: struct {
			Total int64 `json:"total"`
			Page  int   `json:"page"`
			Limit int   `json:"limit"`
		}{
			Total: total,
			Page:  (offset / limit) + 1,
			Limit: limit,
		},
	}, nil
}

func (c *notificationController) MarkAsRead(ctx context.Context, notificationID int64, userID int64) error {
	return c.repo.MarkAsRead(notificationID, userID)
}

func (c *notificationController) MarkAllAsRead(ctx context.Context, userID int64) error {
	return c.repo.MarkAllAsRead(userID)
}

func (c *notificationController) GetUnreadCount(ctx context.Context, userID int64) (*model.NotificationUnreadCountResponse, error) {
	count, err := c.repo.GetUnreadCount(userID)
	if err != nil {
		return nil, err
	}
	return &model.NotificationUnreadCountResponse{UnreadCount: count}, nil
}
