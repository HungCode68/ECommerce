package productvariant

import (
	"encoding/json"
	"fmt"
	"golang/internal/controller/productvariant"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

type VariantHandler struct {
	VariantController productvariant.ProductVariantController
}

func NewVariantHandler(vtController productvariant.ProductVariantController) ProductVariantHandler {
	return &VariantHandler{VariantController: vtController}
}

func (h *VariantHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// errJson - Ghi response JSON lỗi với status code và message
func (h *VariantHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

// CreateVariantHandler - Xử lý request tạo biến thể mới
func (h *VariantHandler) CreateVariantHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)

	if err != nil {
		h.errJson(w, http.StatusBadRequest, "ID invalid")
		return
	}
	var req model.CreateVariantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request ")
		return
	}
	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	variantReponse, err := h.VariantController.CreateVariant(req, productID)
	if err != nil {
		fmt.Printf("Lỗi DB %v \n", err)
		h.errJson(w, http.StatusInternalServerError, "Cannot create variant")
		return
	}
	h.writeJson(w, http.StatusCreated, variantReponse)
}

// UpdateVariantHandler - Xử lý request cập nhật biến thể
func (h *VariantHandler) UpdateVariantHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Product ID invalid")
		return
	}

	variantIdStr := r.PathValue("variantId")
	variantID, err := strconv.ParseInt(variantIdStr, 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Variant ID invalid")
		return
	}

	var req model.UpdateVariantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request")
		return
	}

	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	variantResponse, err := h.VariantController.UpdateVariant(req, variantID, productID)
	if err != nil {
		fmt.Printf("Lỗi DB %v \n", err)
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, variantResponse)
}

// DeleteVariantHandler - Xử lý request xóa biến thể
func (h *VariantHandler) DeleteVariantHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Product ID invalid")
		return
	}

	variantIdStr := r.PathValue("variantId")
	variantID, err := strconv.ParseInt(variantIdStr, 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Variant ID invalid")
		return
	}

	response, err := h.VariantController.DeleteVariant(variantID, productID)
	if err != nil {
		fmt.Printf("Lỗi DB %v \n", err)
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, response)
}
