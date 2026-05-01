package stats

import (
	"net/http"
	"strconv"

	"golang/internal/controller/stats"
	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/utils"
	"golang/internal/validator"
)

type statsHandler struct {
	StatsController stats.StatsController
}

func NewStatsHandler(controller stats.StatsController) StatsHandler {
	return &statsHandler{
		StatsController: controller,
	}
}

// Lấy Dashboard Overview
func (h *statsHandler) GetDashboardOverview(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	filter := model.StatsFilter{
		StartDate: query.Get("start_date"),
		EndDate:   query.Get("end_date"),
	}

	// Validate sơ bộ
	if errs := validator.Validate(filter); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Ngày tháng không hợp lệ", errs)
		return
	}

	//  Gọi Controller
	resp, err := h.StatsController.GetDashboardOverview(r.Context(), filter)
	if err != nil {
		logger.ErrorLogger.Printf("GetDashboardOverview error: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy dữ liệu dashboard", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", resp)
}

// GetDashboardStats: API gộp
func (h *statsHandler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	limit, _ := strconv.Atoi(query.Get("limit"))

	filter := model.StatsFilter{
		StartDate: query.Get("start_date"),
		EndDate:   query.Get("end_date"),
		Limit:     limit,
	}

	// Validate
	if errs := validator.Validate(filter); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Tham số không hợp lệ", errs)
		return
	}

	resp, err := h.StatsController.GetDashboardStats(r.Context(), filter)
	if err != nil {
		logger.ErrorLogger.Printf("GetDashboardStats error: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy dữ liệu dashboard", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", resp)
}

// Lấy Top sản phẩm bán chạy
func (h *statsHandler) GetTopSellingProducts(w http.ResponseWriter, r *http.Request) {
	//  Lấy tham số từ URL Query
	query := r.URL.Query()
	limit, _ := strconv.Atoi(query.Get("limit"))

	// Tạo Filter từ query param
	filter := model.StatsFilter{
		StartDate: query.Get("start_date"),
		EndDate:   query.Get("end_date"),
		Limit:     limit,
	}

	//  Validate tham số
	if errs := validator.Validate(filter); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Tham số lọc không hợp lệ", errs)
		return
	}

	//  Gọi Controller
	resp, err := h.StatsController.GetTopSellingProducts(r.Context(), filter)
	if err != nil {
		logger.ErrorLogger.Printf("GetTopSellingProducts error: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy danh sách sản phẩm", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", resp)
}

// Lấy số liệu thống kê của 1 sản phẩm
func (h *statsHandler) GetProductStats(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	productID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID sản phẩm không hợp lệ", nil)
		return
	}

	//  Lấy filter ngày tháng
	query := r.URL.Query()
	filter := model.StatsFilter{
		StartDate: query.Get("start_date"),
		EndDate:   query.Get("end_date"),
	}

	if errs := validator.Validate(filter); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Tham số ngày tháng không hợp lệ", errs)
		return
	}

	stats, err := h.StatsController.GetProductStats(r.Context(), productID, filter)
	if err != nil {
		logger.ErrorLogger.Printf("GetProductStats error (productID=%d): %v", productID, err)
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy dữ liệu thống kê", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", stats)
}

// Refresh dữ liệu thủ công
func (h *statsHandler) SyncDailyStats(w http.ResponseWriter, r *http.Request) {
	//  Gọi Controller để chạy Job
	err := h.StatsController.SyncDailyStats(r.Context())
	if err != nil {
		logger.ErrorLogger.Printf("SyncDailyStats error: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Cập nhật dữ liệu thất bại", nil)
		return
	}

	// Trả về thông báo thành công
	utils.WriteJSON(w, http.StatusOK, "Đã cập nhật dữ liệu báo cáo thành công (Data refreshed)", nil)
}
