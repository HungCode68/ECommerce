package notification

import (
	"golang/internal/controller/notification"
	"golang/internal/middleware"
	"golang/internal/utils"
	"net/http"
	"strconv"
)

type notificationHandler struct {
	controller notification.NotificationController
}

func NewNotificationHandler(controller notification.NotificationController) NotificationHandler {
	return &notificationHandler{controller: controller}
}

func (h *notificationHandler) GetNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 10
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
		limit = l
	}

	offset := (page - 1) * limit

	resp, err := h.controller.GetNotifications(r.Context(), userID, offset, limit)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi khi lấy thông báo", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", resp)
}

func (h *notificationHandler) MarkAsReadHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	notificationIDStr := r.PathValue("id")
	notificationID, err := strconv.ParseInt(notificationIDStr, 10, 64)
	if err != nil || notificationID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "ID thông báo không hợp lệ", nil)
		return
	}

	if err := h.controller.MarkAsRead(r.Context(), notificationID, userID); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi khi đánh dấu đã đọc", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", nil)
}

func (h *notificationHandler) MarkAllAsReadHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	if err := h.controller.MarkAllAsRead(r.Context(), userID); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi khi đánh dấu đã đọc", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", nil)
}

func (h *notificationHandler) GetUnreadCountHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	resp, err := h.controller.GetUnreadCount(r.Context(), userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi khi lấy số lượng thông báo", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", resp)
}
