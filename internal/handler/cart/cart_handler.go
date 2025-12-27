package cart

import (
	"encoding/json"
	"net/http"
	"strconv"

	"golang/internal/controller/cart"
	"golang/internal/model"
	"golang/internal/utils"     
	"golang/internal/validator" 
)

type cartHandler struct {
	CartController cart.CartController
}

func NewCartHandler(cController cart.CartController) CartHandler {
	return &cartHandler{
		CartController: cController,
	}
}

// Helper: Lấy UserID từ Context 
func getUserIDFromContext(r *http.Request) int64 {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		return 0
	}
	return userID
}

// GetCart: Lấy giỏ hàng
func (h *cartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	// Lấy UserID từ middleware
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	//  Gọi Controller
	cartResp, err := h.CartController.GetCart(r.Context(), userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy giỏ hàng", err.Error())
		return
	}

	// Trả về kết quả
	utils.WriteJSON(w, http.StatusOK, "Lấy giỏ hàng thành công", cartResp)
}

//  AddToCart: Thêm sản phẩm
func (h *cartHandler) AddToCart(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var req model.AddToCartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	// Validate 
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	// Gọi Controller
	if err := h.CartController.AddToCart(r.Context(), userID, req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Không thể thêm vào giỏ", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusCreated, "Thêm sản phẩm vào giỏ thành công", nil)
}

// UpdateCartItem 
func (h *cartHandler) UpdateCartItem(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// Lấy ID từ URL 
	idStr := r.PathValue("id")
	variantID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID sản phẩm không hợp lệ", nil)
		return
	}

	var req model.UpdateCartItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	// Gọi Controller
	if err := h.CartController.UpdateCartItem(r.Context(), userID, variantID, req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Lỗi cập nhật giỏ hàng", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Cập nhật số lượng thành công", nil)
}

//  RemoveCartItems 
func (h *cartHandler) RemoveCartItems(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var req model.RemoveFromCartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	if err := h.CartController.RemoveCartItems(r.Context(), userID, req); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi xóa sản phẩm", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Xóa sản phẩm thành công", nil)
}

//  CalculateCheckoutPreview 
func (h *cartHandler) CalculateCheckoutPreview(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var req model.CheckoutPreviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	resp, err := h.CartController.CalculateCheckoutPreview(r.Context(), userID, req)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Lỗi tính toán", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Tính toán thành công", resp)
}