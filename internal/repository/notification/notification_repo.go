package notification

import (
	"database/sql"
	"golang/internal/model"
)

type notificationRepo struct {
	DB *sql.DB
}

func NewNotificationRepo(db *sql.DB) NotificationRepository {
	return &notificationRepo{DB: db}
}

func (r *notificationRepo) Create(notification *model.Notification) error {
	res, err := r.DB.Exec(`
		INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, created_at)
		VALUES (?, ?, ?, ?, 0, ?, NOW())
	`, notification.UserID, notification.Title, notification.Message, notification.Type, notification.ReferenceID)
	
	if err != nil {
		return err
	}
	
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	notification.ID = id
	return nil
}

func (r *notificationRepo) GetByUserID(userID int64, offset int, limit int) ([]model.Notification, int64, error) {
	var total int64
	err := r.DB.QueryRow(`SELECT COUNT(*) FROM notifications WHERE user_id = ?`, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.DB.Query(`
		SELECT id, user_id, title, message, type, is_read, reference_id, created_at
		FROM notifications
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, userID, limit, offset)
	
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var notifications []model.Notification
	for rows.Next() {
		var n model.Notification
		var isRead int
		var refID sql.NullInt64
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &isRead, &refID, &n.CreatedAt); err != nil {
			return nil, 0, err
		}
		n.IsRead = isRead == 1
		if refID.Valid {
			n.ReferenceID = &refID.Int64
		}
		notifications = append(notifications, n)
	}

	return notifications, total, nil
}

func (r *notificationRepo) MarkAsRead(notificationID int64, userID int64) error {
	_, err := r.DB.Exec(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, notificationID, userID)
	return err
}

func (r *notificationRepo) MarkAllAsRead(userID int64) error {
	_, err := r.DB.Exec(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, userID)
	return err
}

func (r *notificationRepo) GetUnreadCount(userID int64) (int64, error) {
	var count int64
	err := r.DB.QueryRow(`SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0`, userID).Scan(&count)
	return count, err
}
