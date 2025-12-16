package handler

import (
	"encoding/json"
	"fmt"
	"golang/internal/controller"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

// ProductHandler - Struct xử lý các HTTP request liên quan đến sản phẩm
type ProductHandler struct {
	PrtController *controller.ProductController
}

// NewProductHandler - Constructor tạo handler mới với controller
func NewProductHandler(prtController *controller.ProductController) *ProductHandler {
	return &ProductHandler{PrtController: prtController}
}

// =================================================================
// HELPER FUNCTIONS - Hàm hỗ trợ
// =================================================================

// writeJson - Ghi response JSON với status code và data
func (h *ProductHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// errJson - Ghi response JSON lỗi với status code và message
func (h *ProductHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

// =================================================================
// ADMIN HANDLERS - Xử lý request từ Admin
// =================================================================

// CreateProductHandler - Xử lý request tạo sản phẩm mới
// Validate dữ liệu đầu vào, kiểm tra trùng lặp tên/slug, tạo sản phẩm vào DB
func (h *ProductHandler) CreateProductHandler(w http.ResponseWriter, r *http.Request) {
	var req model.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request ")
		return
	}
	if err := validator.NewCustomValidator().Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	productResponse, err := h.PrtController.CreateProductController(req)
	if err != nil {
		if err.Error() == "Product name already exists" || err.Error() == "Product slug already exists" {
			h.errJson(w, http.StatusConflict, err.Error())
			return
		}
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusCreated, productResponse)
}

// AdminGetProductHandler - Lấy chi tiết sản phẩm cho Admin theo ID/Name/Slug
// Hỗ trợ tìm kiếm qua path parameter (id, slug) hoặc query parameter (name)
func (h *ProductHandler) AdminGetProductHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	slugStr := r.PathValue("slug")
	nameStr := r.URL.Query().Get("name")
	var parsedErr error

	req := &model.GetProductRequest{}
	if idStr != "" {
		req.ID, parsedErr = strconv.ParseInt(idStr, 10, 64)
	} else if slugStr != "" {
		req.Slug = slugStr
	} else if nameStr != "" {
		req.Name = nameStr
	}
	if parsedErr != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid ID format in path")
		return
	}
	adminProductDetailResponse, err := h.PrtController.AdminGetProductController(req)

	if err != nil {
		h.errJson(w, http.StatusNotFound, "Product Not Found")
		return
	}

	h.writeJson(w, http.StatusAccepted, adminProductDetailResponse)

}

// UserGetProductHandlerDetail - Lấy chi tiết đầy đủ sản phẩm cho User
// Chỉ trả về sản phẩm đã published (is_published = true)
func (h *ProductHandler) UserGetProductHandlerDetail(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	slugStr := r.PathValue("slug")
	nameStr := r.URL.Query().Get("name")
	var parsedErr error

	req := &model.GetProductRequest{}
	if idStr != "" {
		req.ID, parsedErr = strconv.ParseInt(idStr, 10, 64)
	} else if slugStr != "" {
		req.Slug = slugStr
	} else if nameStr != "" {
		req.Name = nameStr
	}
	if parsedErr != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid ID format in path")
		return
	}
	userProductDetailResponse, err := h.PrtController.UserGetProductDetailController(req)

	if err != nil {
		h.errJson(w, http.StatusNotFound, "Product Not Found")
		return
	}

	h.writeJson(w, http.StatusAccepted, userProductDetailResponse)
}

// UserGetProductHandler - Lấy thông tin rút gọn sản phẩm cho User
// Chỉ trả về sản phẩm published với thông tin cơ bản (name, slug, price, rating)
func (h *ProductHandler) UserGetProductHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	slugStr := r.PathValue("slug")
	nameStr := r.URL.Query().Get("name")
	var parsedErr error

	req := &model.GetProductRequest{}
	if idStr != "" {
		req.ID, parsedErr = strconv.ParseInt(idStr, 10, 64)
	} else if slugStr != "" {
		req.Slug = slugStr
	} else if nameStr != "" {
		req.Name = nameStr
	}
	if parsedErr != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid ID format in path")
		return
	}
	userProductDetailResponse, err := h.PrtController.UserGetProductController(req)

	if err != nil {
		h.errJson(w, http.StatusNotFound, "Product Not Found")
		return
	}

	h.writeJson(w, http.StatusAccepted, userProductDetailResponse)
}

// AdminGetManyProductController - Lấy nhiều sản phẩm theo danh sách IDs
// Nhận body JSON {"ids": [1,2,3]}, validate và trả về danh sách sản phẩm
func (h *ProductHandler) AdminGetManyProductController(w http.ResponseWriter, r *http.Request) {
	var req model.GetManyProductsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if err := validator.NewCustomValidator().Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	productsResponse, err := h.PrtController.AdminGetManyProductByIDController(req.IDs)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}

// UserSearchProductHandler - Tìm kiếm sản phẩm cho User
// Tìm kiếm theo tên (LIKE) hoặc thương hiệu, chỉ trả về sản phẩm published
// Validate nghiêm ngặt: DisallowUnknownFields, yêu cầu ít nhất 1 tham số
func (h *ProductHandler) UserSearchProductHandler(w http.ResponseWriter, r *http.Request) {
	var req model.SearchProductsRequest

	// Strict JSON validation
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Validate struct
	if err := validator.NewCustomValidator().Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	// Kiểm tra phải có ít nhất 1 tham số tìm kiếm
	if req.Search == "" && req.Brand == "" {
		h.errJson(w, http.StatusBadRequest, "At least one search parameter (search or brand) is required")
		return
	}

	// Call controller
	productsResponse, err := h.PrtController.UserSearchProductByNameController(&req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminSearchProductsHandler - Tìm kiếm sản phẩm cho Admin
// Tương tự UserSearchProductHandler nhưng không lọc theo is_published
func (h *ProductHandler) AdminSearchProductsHandler(w http.ResponseWriter, r *http.Request) {
	var req model.SearchProductsRequest

	// Strict JSON validation
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Validate struct
	if err := validator.NewCustomValidator().Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	// Kiểm tra phải có ít nhất 1 tham số tìm kiếm
	if req.Search == "" && req.Brand == "" {
		h.errJson(w, http.StatusBadRequest, "At least one search parameter (search or brand) is required")
		return
	}

	// Call controller
	productsResponse, err := h.PrtController.AdminSearchProductsController(&req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, productsResponse)
}

// UpdateProductHandler - Cập nhật thông tin sản phẩm
// Lấy ID từ path, validate dữ liệu, gọi controller để update
func (h *ProductHandler) UpdateProductHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {

		h.errJson(w, http.StatusBadRequest, "Invalid product ID in path")
		return
	}
	var req model.UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if err := validator.NewCustomValidator().Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	adminReponse, err := h.PrtController.UpdateProductController(req, id)
	if err != nil {
		if err.Error() == "Product not found" {
			h.errJson(w, http.StatusNotFound, err.Error())
			return
		}
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, adminReponse)
}

// AdminGetAllProductHandler - Lấy tất cả sản phẩm (không bao gồm đã xóa mềm)
func (h *ProductHandler) AdminGetAllProductHandler(w http.ResponseWriter, r *http.Request) {
	productsResponse, err := h.PrtController.AdminGetAllProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminDeleteSoftProductHandler - Xóa mềm sản phẩm đơn theo ID
// Set deleted_at và status = 'archived' cho sản phẩm
func (h *ProductHandler) AdminDeleteSoftProductHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid product ID in path")
		return
	}
	err = h.PrtController.AdminDeleteSoftProductController(id)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, map[string]string{"message": "Product deleted softly successfully"})
}

// AdminGetAllSoftDeletedProductsHandler - Lấy danh sách tất cả sản phẩm đã xóa mềm
// Trả về các sản phẩm có deleted_at IS NOT NULL và status = 'archived'
func (h *ProductHandler) AdminGetAllSoftDeletedProductsHandler(w http.ResponseWriter, r *http.Request) {
	productsResponse, err := h.PrtController.AdminGetAllSoftDeletedProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminBulkDeleteSoftProductsHandler - Xóa mềm tất cả sản phẩm đang active
// Set deleted_at cho tất cả sản phẩm có status = 'active'
func (h *ProductHandler) AdminBulkDeleteSoftProductsHandler(w http.ResponseWriter, r *http.Request) {
	err := h.PrtController.AdminDeleteAllSoftDeletedProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Cannot delete all products")
	}
	h.writeJson(w, http.StatusOK, map[string]string{"message": "All products deleted softly successfully"})

}

// AdminDeleteAllProductsHandler - Xóa vĩnh viễn tất cả sản phẩm (hard delete)
// CẢNH BÁO: Xóa hoàn toàn tất cả sản phẩm khỏi database
func (h *ProductHandler) AdminDeleteAllProductsHandler(w http.ResponseWriter, r *http.Request) {
	err := h.PrtController.AdminDeleteAllProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Cannot delete all products")
	}
	h.writeJson(w, http.StatusOK, map[string]string{"message": "All products deleted successfully"})
}
