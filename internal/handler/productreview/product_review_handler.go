package productreview

import (
	"encoding/json"
	"fmt"
	"golang/internal/controller/productreviews"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

type productReviewHandler struct {
	controller productreviews.ProductReviewsController
}

func NewProductReviewHandler(ctrl productreviews.ProductReviewsController) ProductReviewHandler {
	return &productReviewHandler{controller: ctrl}
}

func (h *productReviewHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *productReviewHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

// CreateReviewHandler handles posting a review for a product
func (h *productReviewHandler) CreateReviewHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)
	if err != nil || productID <= 0 {
		h.errJson(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	// userID is stored by AuthMiddleware
	userIDVal := r.Context().Value("userID")
	userID, ok := userIDVal.(int64)
	if !ok || userID == 0 {
		h.errJson(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req model.CreateProductReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}



	resp, err := h.controller.CreateReview(r.Context(), req, productID, userID)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusCreated, resp)
}

// ListReviewsHandler returns all reviews for a product along with summary
func (h *productReviewHandler) ListReviewsHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)
	if err != nil || productID <= 0 {
		h.errJson(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	resp, err := h.controller.ListReviews(productID)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, resp)
}

// DeleteReviewHandler deletes a review by ID (admin or owner can be enforced upstream)
func (h *productReviewHandler) DeleteReviewHandler(w http.ResponseWriter, r *http.Request) {
	reviewIDStr := r.PathValue("reviewId")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil || reviewID <= 0 {
		h.errJson(w, http.StatusBadRequest, "Invalid review ID")
		return
	}

	resp, err := h.controller.DeleteReview(reviewID)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, resp)
}
