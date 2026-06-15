package callback

import (
	"encoding/json"
	"fmt"
	callbackController "golang/internal/controller/callback"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

type callbackHandler struct {
	ctrl callbackController.CallbackController
}

func NewCallbackHandler(ctrl callbackController.CallbackController) CallbackHandler {
	return &callbackHandler{ctrl: ctrl}
}

func (h *callbackHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func (h *callbackHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

func (h *callbackHandler) PublicCreate(w http.ResponseWriter, r *http.Request) {
	var req model.CreateCallbackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("%v", err))
		return
	}

	item, err := h.ctrl.Create(req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Failed to submit callback request")
		return
	}

	h.writeJson(w, http.StatusCreated, map[string]any{
		"code":    http.StatusCreated,
		"message": "Callback request submitted successfully",
		"data":    item,
	})
}

func (h *callbackHandler) AdminGetAll(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize < 1 {
		pageSize = 10
	}

	list, total, err := h.ctrl.GetAll(status, page, pageSize)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Failed to fetch callback requests")
		return
	}

	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Callback requests retrieved successfully",
		"data":    list,
		"meta": map[string]any{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *callbackHandler) AdminUpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var req model.UpdateCallbackStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("%v", err))
		return
	}

	item, err := h.ctrl.UpdateStatus(id, req)
	if err != nil {
		if err.Error() == "callback request not found" {
			h.errJson(w, http.StatusNotFound, "Callback request not found")
			return
		}
		h.errJson(w, http.StatusInternalServerError, "Failed to update status")
		return
	}

	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Status updated successfully",
		"data":    item,
	})
}

func (h *callbackHandler) AdminDelete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	if err := h.ctrl.Delete(id); err != nil {
		if err.Error() == "callback request not found" {
			h.errJson(w, http.StatusNotFound, "Callback request not found")
			return
		}
		h.errJson(w, http.StatusInternalServerError, "Failed to delete callback request")
		return
	}

	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Callback request deleted successfully",
		"data":    nil,
	})
}
