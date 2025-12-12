package handler

import (
	"encoding/json"
	"golang/internal/controller"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

type AddressHandler struct {
	AddressController *controller.AddressController
	Validator         *validator.CustomValidator
}

// Khởi tạo AddressHandler
func NewAddressHandler(addressController *controller.AddressController, v *validator.CustomValidator) *AddressHandler {
	return &AddressHandler{
		AddressController: addressController,
		Validator:         v,
	}
}

// Tạo địa chỉ mới
func (h *AddressHandler) CreateAddress(w http.ResponseWriter, r *http.Request) {
	// Lấy UserID từ Context (Bắt buộc phải đăng nhập)
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Không xác định được người dùng", "Token lỗi")
		return
	}

	// Decode JSON
	var req model.CreateAddressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	//  Validate
	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	//  Gọi Controller
	res, err := h.AddressController.CreateAddress(userID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi tạo địa chỉ", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, "Tạo địa chỉ thành công", res)
}

// Lấy danh sách địa chỉ của tôi
func (h *AddressHandler) GetMyAddresses(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	res, err := h.AddressController.GetMyAddresses(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy danh sách địa chỉ", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Lấy danh sách địa chỉ thành công", res)
}

// Lấy chi tiết 1 địa chỉ
func (h *AddressHandler) GetAddressByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID địa chỉ không hợp lệ", nil)
		return
	}

	res, err := h.AddressController.GetAddressByID(id, userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Lỗi lấy chi tiết địa chỉ", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Lấy chi tiết địa chỉ thành công", res)
}

// Cập nhật địa chỉ
func (h *AddressHandler) UpdateAddress(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID địa chỉ không hợp lệ", nil)
		return
	}

	var req model.UpdateAddressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "JSON không hợp lệ", err.Error())
		return
	}

	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.AddressController.UpdateAddress(id, userID, req)
	if err != nil {
		writeError(w, http.StatusNotFound, "Lỗi cập nhật địa chỉ", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Cập nhật địa chỉ thành công", res)
}

// Xóa địa chỉ
func (h *AddressHandler) DeleteAddress(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID địa chỉ không hợp lệ", nil)
		return
	}

	err = h.AddressController.DeleteAddress(id, userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Lỗi xóa địa chỉ", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Xóa địa chỉ thành công", nil)
}

// Đặt làm địa chỉ mặc định
func (h *AddressHandler) SetDefaultAddress(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Token không hợp lệ", nil)
		return
	}

	idStr := r.PathValue("id")
	addressID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID địa chỉ không hợp lệ", nil)
		return
	}

	err = h.AddressController.SetDefaultAddress(userID, addressID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Lỗi đặt địa chỉ mặc định", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Đã đặt làm địa chỉ mặc định", nil)
}