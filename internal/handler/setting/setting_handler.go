package setting

import (
	"encoding/json"
	"fmt"
	settingController "golang/internal/controller/setting"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
)

type settingHandler struct {
	ctrl settingController.SettingController
}

func NewSettingHandler(ctrl settingController.SettingController) SettingHandler {
	return &settingHandler{ctrl: ctrl}
}

func (h *settingHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func (h *settingHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

func (h *settingHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.ctrl.GetSettings()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "DB ERROR: "+err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Settings retrieved successfully",
		"data":    settings,
	})
}

func (h *settingHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req model.UpdateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("%v", err))
		return
	}

	err := h.ctrl.UpdateSettings(req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Failed to update settings")
		return
	}

	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Settings updated successfully",
		"data":    nil,
	})
}
