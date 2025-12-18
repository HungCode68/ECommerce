package handler

import (
	"encoding/json"
	"golang/internal/controller"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
	"strings"
)

// CategoryHandler struct
type CategoryHandler struct {
	CategoryController *controller.CategoryController
	Validator          *validator.CustomValidator
}

// NewCategoryHandler: Constructor
func NewCategoryHandler(catController *controller.CategoryController, v *validator.CustomValidator) *CategoryHandler {
	return &CategoryHandler{
		CategoryController: catController,
		Validator:          v,
	}
}


// CreateCategory: Tạo danh mục mới
func (h *CategoryHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req model.CreateCategoryRequest

	// Decode JSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	// Validate
	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	// Call Controller
	res, err := h.CategoryController.CreateCategory(req)
	if err != nil {
		if strings.Contains(err.Error(), "đã tồn tại") {
			writeError(w, http.StatusConflict, "Dữ liệu trùng lặp", err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "Lỗi tạo danh mục", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, "Tạo danh mục thành công", res)
}

// UpdateCategory: Cập nhật danh mục
func (h *CategoryHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	// Lấy ID từ URL
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	var req model.UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	// Validate
	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	// Call Controller
	res, err := h.CategoryController.UpdateCategory(id, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi cập nhật danh mục", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Cập nhật danh mục thành công", res)
}

// DeleteCategory: Xóa mềm 1 danh mục
func (h *CategoryHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	err = h.CategoryController.DeleteCategory(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi xóa danh mục", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Xóa danh mục thành công", nil)
}

// DeleteManyCategories: Xóa mềm nhiều danh mục
func (h *CategoryHandler) DeleteManyCategories(w http.ResponseWriter, r *http.Request) {
	var req model.DeleteManyCategoriesRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	// Validate
	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	err := h.CategoryController.DeleteManyCategories(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi xóa danh sách danh mục", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Xóa danh sách danh mục thành công", nil)
}


// DeleteCategoryHard: Xóa cứng 1 danh mục (Vĩnh viễn)
func (h *CategoryHandler) DeleteCategoryHard(w http.ResponseWriter, r *http.Request) {
	// 1. Lấy ID từ URL
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	// Gọi Controller xử lý
	err = h.CategoryController.DeleteCategoryHard(id)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Không thể xóa danh mục", err.Error())
		return
	}

	// Trả về thành công
	writeJSON(w, http.StatusOK, "Đã xóa vĩnh viễn danh mục thành công", nil)
}

// AdminGetAllCategories: Lấy tất cả danh mục (cho Admin)
func (h *CategoryHandler) AdminGetAllCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.CategoryController.AdminGetAllCategories()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy danh sách danh mục", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Lấy danh sách thành công", cats)
}

// AdminGetCategoryByID: Lấy chi tiết theo ID (cho Admin)
func (h *CategoryHandler) AdminGetCategoryByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	cat, err := h.CategoryController.AdminGetCategoryByID(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy chi tiết danh mục", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Lấy chi tiết thành công", cat)
}

// AdminSearchCategories: Tìm kiếm danh mục (cho Admin - All)
func (h *CategoryHandler) AdminSearchCategories(w http.ResponseWriter, r *http.Request) {
	rawKeyword := r.URL.Query().Get("q")
	keyword := strings.TrimSpace(rawKeyword)

	if keyword == "" {
		writeError(w, http.StatusBadRequest, "Thiếu từ khóa", "Vui lòng nhập từ khóa tìm kiếm (?q=...)")
		return
	}

	cats, err := h.CategoryController.AdminSearchCategories(keyword)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi tìm kiếm", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Tìm kiếm thành công", cats)
}


// UserGetActiveCategories: Lấy menu danh mục (Chỉ Active)
func (h *CategoryHandler) UserGetActiveCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.CategoryController.UserGetActiveCategories()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy danh mục", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Lấy danh mục thành công", cats)
}

// UserSearchCategories: Tìm kiếm danh mục (Chỉ Active)
func (h *CategoryHandler) UserSearchCategories(w http.ResponseWriter, r *http.Request) {
	rawKeyword := r.URL.Query().Get("q")
	keyword := strings.TrimSpace(rawKeyword)

	if keyword == "" {
		writeError(w, http.StatusBadRequest, "Thiếu từ khóa", "Vui lòng nhập từ khóa tìm kiếm (?q=...)")
		return
	}

	cats, err := h.CategoryController.UserSearchCategories(keyword)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi tìm kiếm", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Tìm kiếm thành công", cats)
}

