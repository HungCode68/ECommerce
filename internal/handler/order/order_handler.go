package order

import (
	"encoding/json"
	"net/http"
	"strconv"

	"golang/internal/controller/order"
	"golang/internal/model"
	"golang/internal/utils"     
	"golang/internal/validator" 
)

type orderHandler struct {
	OrderController order.OrderController
}

func NewOrderHandler(controller order.OrderController) OrderHandler {
	return &orderHandler{
		OrderController: controller,
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


// Tạo đơn hàng mới
func (h *orderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	//  Parse Body
	var req model.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON lỗi", err.Error())
		return
	}

	//  Validate
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu không hợp lệ", errs)
		return
	}

	//  Gọi Controller
	resp, err := h.OrderController.CreateOrder(r.Context(), userID, req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Tạo đơn hàng thất bại", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusCreated, "Đặt hàng thành công", resp)
}

// Danh sách đơn hàng của tôi
func (h *orderHandler) GetMyListOrders(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// Lấy tham số từ URL Query
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	limit, _ := strconv.Atoi(query.Get("limit"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}

	filter := model.OrderFilter{
		Page:          page,
		Limit:         limit,
		Status:        query.Get("status"),         
		PaymentStatus: query.Get("payment_status"), 
		Keyword:       query.Get("keyword"),
		OrderID:       query.Get("order_id"),       
		StartDate:     query.Get("start_date"),
		EndDate:       query.Get("end_date"),
	}

	if errs := validator.Validate(filter); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Tham số lọc không hợp lệ", errs)
		return
	}

	orders, total, err := h.OrderController.GetMyListOrders(r.Context(), userID, filter)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy danh sách đơn hàng", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Lấy danh sách thành công", map[string]interface{}{
		"orders": orders,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// Chi tiết đơn hàng
func (h *orderHandler) GetMyOrderDetail(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// Lấy ID từ URL
	idStr := r.PathValue("id")
	orderID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID đơn hàng không hợp lệ", nil)
		return
	}

	order, err := h.OrderController.GetMyOrder(r.Context(), userID, orderID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Không thể lấy chi tiết đơn hàng", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Chi tiết đơn hàng", order)
}

// Hủy đơn hàng
func (h *orderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	idStr := r.PathValue("id")
	orderID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID đơn hàng không hợp lệ", nil)
		return
	}

	// Parse lý do hủy từ body
	type CancelReq struct {
		Reason string `json:"reason"`
	}
	var req CancelReq
	_ = json.NewDecoder(r.Body).Decode(&req) 

	if req.Reason == "" {
		req.Reason = "Không có lý do"
	}

	err = h.OrderController.CancelOrder(r.Context(), userID, orderID, req.Reason)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Hủy đơn thất bại", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Hủy đơn hàng thành công", nil)
}


// Tìm kiếm đơn hàng + list đơn hàng 
func (h *orderHandler) SearchOrders(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	limit, _ := strconv.Atoi(query.Get("limit"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}

	// Parse UserID nếu Admin muốn lọc theo user cụ thể
	targetUserID, _ := strconv.ParseInt(query.Get("user_id"), 10, 64)

	filter := model.OrderFilter{
		Page:          page,
		Limit:         limit,
		Status:        query.Get("status"),
		PaymentStatus: query.Get("payment_status"),
		OrderID:       query.Get("order_id"),
		UserID:        targetUserID, 
		StartDate:     query.Get("start_date"),
		EndDate:       query.Get("end_date"),
	}

	if errs := validator.Validate(filter); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Tham số lọc không hợp lệ", errs)
		return
	}

	orders, total, err := h.OrderController.SearchOrders(r.Context(), filter)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi tìm kiếm đơn hàng", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", map[string]interface{}{
		"orders": orders,
		"total":  total,
	})
}

// Chi tiết đơn hàng 
func (h *orderHandler) GetAdminOrderDetail(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	orderID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID không hợp lệ", nil)
		return
	}

	orderDetail, err := h.OrderController.GetAdminOrderDetail(r.Context(), orderID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Không tìm thấy đơn hàng", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Chi tiết đơn hàng (Admin)", orderDetail)
}

// Cập nhật trạng thái đơn hàng 
func (h *orderHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	idStr := r.PathValue("id")
	orderID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID lỗi", nil)
		return
	}

	var req model.AdminUpdateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "JSON lỗi", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu không hợp lệ", errs)
		return
	}

	err = h.OrderController.UpdateOrderStatus(r.Context(), orderID, req, userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Cập nhật thất bại", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Cập nhật trạng thái thành công", nil)
}

// Xác nhận thanh toán đơn hàng
func (h *orderHandler) ConfirmPayment(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromContext(r)
	if userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	idStr := r.PathValue("id")
	orderID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID lỗi", nil)
		return
	}

	var req model.ConfirmPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "JSON lỗi", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Trạng thái không hợp lệ", errs)
		return
	}

	err = h.OrderController.ConfirmPayment(r.Context(), orderID, req.Status, userID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Xác nhận thanh toán thất bại", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Xác nhận thanh toán thành công", nil)
}
