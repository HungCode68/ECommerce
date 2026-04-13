package coupons

import (
	"encoding/json"
	"golang/internal/controller/coupons"
	"golang/internal/model"
	"golang/internal/utils"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

type couponsHandler struct {
	CouponsController coupons.CouponsController
}

func NewCouponsHandler(c coupons.CouponsController) CouponsHandler {
	return &couponsHandler{CouponsController: c}
}

func (h *couponsHandler) CreateCoupon(w http.ResponseWriter, r *http.Request) {
	var req model.CreateCouponRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}
	res, err := h.CouponsController.CreateCoupon(r.Context(), req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi tạo mã giảm giá", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusCreated, "Tạo mã giảm giá thành công", res)
}

func (h *couponsHandler) UpdateCoupon(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	var req model.UpdateCouponRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.CouponsController.UpdateCoupon(r.Context(), id, req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi cập nhật mã giảm giá", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, "Cập nhật mã giảm giá thành công", res)
}

func (h *couponsHandler) DeleteCoupon(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}
	err = h.CouponsController.DeleteCoupon(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi xóa mã giảm giá", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, "Đã xoá mã giảm giá thành công", nil)
}

func (h *couponsHandler) BulkDeleteCoupon(w http.ResponseWriter, r *http.Request) {
	var req model.BulkDeleteCouponsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}
	err := h.CouponsController.BulkDeleteCoupon(r.Context(), req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi xóa nhiều mã giảm giá", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, "Xoá danh sách mã giảm giá thành công", nil)
}

func (h *couponsHandler) GetCouponByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	res, err := h.CouponsController.GetCouponByID(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Không tìm thấy mã giảm giá", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, "Thành công", res)
}

func (h *couponsHandler) GetAllCoupons(w http.ResponseWriter, r *http.Request) {
	req := model.GetAllCouponsRequest{
		Search: r.URL.Query().Get("search"),
	}
	res, err := h.CouponsController.GetAllCoupons(r.Context(), req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi load mã giảm giá", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, "Thành công", res)
}

func (h *couponsHandler) GetAvailableCoupons(w http.ResponseWriter, r *http.Request) {
	var req model.GetAvailableCouponsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.CouponsController.GetAvailableCoupons(r.Context(), req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi load danh sách mã giảm giá", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, "Thành công", res)
}

func (h *couponsHandler) ValidateCoupon(w http.ResponseWriter, r *http.Request) {
	var req model.ValidateCouponRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.CouponsController.ValidateCoupon(r.Context(), req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi kiểm tra mã", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, "Thành công", res)
}

func (h *couponsHandler) ApplyCoupon(w http.ResponseWriter, r *http.Request) {
	var req model.ApplyCouponRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}
	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.CouponsController.ApplyCoupon(r.Context(), req)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Áp dụng thất bại", err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, "Áp dụng thành công", res)
}
