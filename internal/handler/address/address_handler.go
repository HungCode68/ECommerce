package address

import (
	"encoding/json"
	"golang/internal/controller/address"
	"golang/internal/logger"
	"golang/internal/middleware"
	"golang/internal/model"
	"golang/internal/utils"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

type addressHandler struct {
	AddressController address.AddressController
}

// Khởi tạo AddressHandler
func NewAddressHandler(addressController address.AddressController) AddressHandler {
	return &addressHandler{
		AddressController: addressController,
	}
}

// Tạo địa chỉ mới
func (h *addressHandler) CreateAddress(w http.ResponseWriter, r *http.Request) {
	// Lấy UserID từ Context (Bắt buộc phải đăng nhập)
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Không xác định được người dùng", "Token lỗi")
		return
	}

	// Decode JSON
	var req model.CreateAddressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", nil)
		return
	}

	//  Validate
	if errs := validator.Validate(req); errs != nil {
		logger.WarnLogger.Printf("CreateAddress validation failed: %+v", errs)
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	//  Gọi Controller
	res, err := h.AddressController.CreateAddress(userID, req)
	if err != nil {
		logger.ErrorLogger.Printf("CreateAddress error (userID=%d): %v", userID, err)
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi tạo địa chỉ", nil)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, "Tạo địa chỉ thành công", res)
}

// Lấy danh sách địa chỉ của tôi
func (h *addressHandler) GetMyAddresses(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	res, err := h.AddressController.GetMyAddresses(userID)
	if err != nil {
		logger.ErrorLogger.Printf("GetMyAddresses error (userID=%d): %v", userID, err)
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy danh sách địa chỉ", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Lấy danh sách địa chỉ thành công", res)
}

// Lấy chi tiết 1 địa chỉ
func (h *addressHandler) GetAddressByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID địa chỉ không hợp lệ", nil)
		return
	}

	res, err := h.AddressController.GetAddressByID(id, userID)
	if err != nil {
		logger.ErrorLogger.Printf("GetAddressByID error (addressID=%d, userID=%d): %v", id, userID, err)
		utils.WriteError(w, http.StatusNotFound, "Lỗi lấy chi tiết địa chỉ", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Lấy chi tiết địa chỉ thành công", res)
}

// Cập nhật địa chỉ
func (h *addressHandler) UpdateAddress(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID địa chỉ không hợp lệ", nil)
		return
	}

	var req model.UpdateAddressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "JSON không hợp lệ", nil)
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.AddressController.UpdateAddress(id, userID, req)
	if err != nil {
		logger.ErrorLogger.Printf("UpdateAddress error (addressID=%d, userID=%d): %v", id, userID, err)
		utils.WriteError(w, http.StatusNotFound, "Lỗi cập nhật địa chỉ", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Cập nhật địa chỉ thành công", res)
}

// Xóa địa chỉ
func (h *addressHandler) DeleteAddress(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID địa chỉ không hợp lệ", nil)
		return
	}

	err = h.AddressController.DeleteAddress(id, userID)
	if err != nil {
		logger.ErrorLogger.Printf("DeleteAddress error (addressID=%d, userID=%d): %v", id, userID, err)
		utils.WriteError(w, http.StatusNotFound, "Lỗi xóa địa chỉ", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Xóa địa chỉ thành công", nil)
}

// Đặt làm địa chỉ mặc định
func (h *addressHandler) SetDefaultAddress(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	idStr := r.PathValue("id")
	addressID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID địa chỉ không hợp lệ", nil)
		return
	}

	err = h.AddressController.SetDefaultAddress(userID, addressID)
	if err != nil {
		logger.ErrorLogger.Printf("SetDefaultAddress error (addressID=%d, userID=%d): %v", addressID, userID, err)
		utils.WriteError(w, http.StatusNotFound, "Lỗi đặt địa chỉ mặc định", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Đã đặt làm địa chỉ mặc định", nil)
}
