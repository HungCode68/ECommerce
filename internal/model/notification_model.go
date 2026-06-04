package model

type Notification struct {
	ID        int64  `json:"id"`
	UserID    int64  `json:"user_id"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Type      string `json:"type"`
	IsRead    bool   `json:"is_read"`
	CreatedAt string `json:"created_at"`
}

type NotificationListResponse struct {
	Data       []Notification `json:"data"`
	Pagination struct {
		Total int64 `json:"total"`
		Page  int   `json:"page"`
		Limit int   `json:"limit"`
	} `json:"pagination"`
}

type NotificationUnreadCountResponse struct {
	UnreadCount int64 `json:"unread_count"`
}
