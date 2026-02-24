package cart

import (
	"encoding/json"
	"net/http"
	"strconv"

	"golang/internal/controller/cart"
	"golang/internal/middleware"
	"golang/internal/model"
	"golang/internal/utils"
	"golang/internal/validator"
)

// Request body size limit (1MB)
const maxBodySize = 1 << 20

type cartHandler struct {
	CartController cart.CartController
}

func NewCartHandler(cController cart.CartController) CartHandler {
	return &cartHandler{
		CartController: cController,
	}
}

// GetCart: Lấy giỏ hàng
func (h *cartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	// Lấy UserID từ middleware
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// Gọi Controller
	cartResp, err := h.CartController.GetCart(r.Context(), userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy giỏ hàng", nil)
		return
	}

	// Trả về kết quả
	utils.WriteJSON(w, http.StatusOK, "Lấy giỏ hàng thành công", cartResp)
}

// AddToCart: Thêm sản phẩm
func (h *cartHandler) AddToCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)

	var req model.AddToCartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", nil)
		return
	}

	// Validate
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	// Gọi Controller
	if err := h.CartController.AddToCart(r.Context(), userID, req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, "Thêm sản phẩm vào giỏ thành công", nil)
}

// UpdateCartItem
func (h *cartHandler) UpdateCartItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)

	// Lấy ID từ URL
	idStr := r.PathValue("id")
	variantID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID sản phẩm không hợp lệ", nil)
		return
	}

	var req model.UpdateCartItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", nil)
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	// Gọi Controller
	if err := h.CartController.UpdateCartItem(r.Context(), userID, variantID, req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Cập nhật số lượng thành công", nil)
}

// RemoveCartItems
func (h *cartHandler) RemoveCartItems(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)

	var req model.RemoveFromCartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", nil)
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	if err := h.CartController.RemoveCartItems(r.Context(), userID, req); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi xóa sản phẩm", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Xóa sản phẩm thành công", nil)
}

// CalculateCheckoutPreview
func (h *cartHandler) CalculateCheckoutPreview(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)

	var req model.CheckoutPreviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", nil)
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	resp, err := h.CartController.CalculateCheckoutPreview(r.Context(), userID, req)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Tính toán thành công", resp)
}
