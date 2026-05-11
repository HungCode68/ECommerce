package banner

import (
	"encoding/json"
	"fmt"
	bannerController "golang/internal/controller/banner"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

type bannerHandler struct {
	ctrl bannerController.BannerController
}

func NewBannerHandler(ctrl bannerController.BannerController) BannerHandler {
	return &bannerHandler{ctrl: ctrl}
}

func (h *bannerHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func (h *bannerHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

func (h *bannerHandler) AdminGetAllBanners(w http.ResponseWriter, r *http.Request) {
	banners, err := h.ctrl.GetAll()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Failed to fetch banners")
		return
	}
	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Banners retrieved successfully",
		"data":    banners,
	})
}

func (h *bannerHandler) UserGetActiveBanners(w http.ResponseWriter, r *http.Request) {
	position := r.URL.Query().Get("position")
	banners, err := h.ctrl.GetActiveByPosition(position)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Failed to fetch banners")
		return
	}
	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Banners retrieved successfully",
		"data":    banners,
	})
}

func (h *bannerHandler) AdminCreateBanner(w http.ResponseWriter, r *http.Request) {
	var req model.CreateBannerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("%v", err))
		return
	}

	banner, err := h.ctrl.Create(req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Failed to create banner")
		return
	}
	h.writeJson(w, http.StatusCreated, map[string]any{
		"code":    http.StatusCreated,
		"message": "Banner created successfully",
		"data":    banner,
	})
}

func (h *bannerHandler) AdminUpdateBanner(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid banner ID")
		return
	}

	var req model.UpdateBannerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("%v", err))
		return
	}

	banner, err := h.ctrl.Update(id, req)
	if err != nil {
		if err.Error() == "banner not found" {
			h.errJson(w, http.StatusNotFound, "Banner not found")
			return
		}
		h.errJson(w, http.StatusInternalServerError, "Failed to update banner")
		return
	}
	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Banner updated successfully",
		"data":    banner,
	})
}

func (h *bannerHandler) AdminDeleteBanner(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid banner ID")
		return
	}
	if err := h.ctrl.Delete(id); err != nil {
		if err.Error() == "banner not found" {
			h.errJson(w, http.StatusNotFound, "Banner not found")
			return
		}
		h.errJson(w, http.StatusInternalServerError, "Failed to delete banner")
		return
	}
	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Banner deleted successfully",
		"data":    nil,
	})
}

