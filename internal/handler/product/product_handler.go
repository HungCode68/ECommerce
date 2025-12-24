package product

import (
	"encoding/json"
	"fmt"
	"golang/internal/controller/product"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

// ProductHandler - Struct xử lý các HTTP request liên quan đến sản phẩm
type productHandler struct {
	PrtController product.ProductController
}

// NewProductHandler - Constructor tạo handler mới với controller
func NewProductHandler(prtController product.ProductController) ProductHandler {
	return &productHandler{PrtController: prtController}
}

// writeJson - Ghi response JSON với status code và data
func (h *productHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *productHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

// CreateProductHandler - Tạo sản phẩm mới

func (h *productHandler) CreateProductHandler(w http.ResponseWriter, r *http.Request) {
	var req model.CreateProductRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := validator.Validate(req); err != nil {
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

// UpdateProductHandler - Cập nhật sản phẩm
func (h *productHandler) UpdateProductHandler(w http.ResponseWriter, r *http.Request) {
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

	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	adminReponse, err := h.PrtController.UpdateProductController(r.Context(),req, id)
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

// AdminGetProductHandler - Lấy chi tiết cho Admin

func (h *productHandler) AdminGetProductHandler(w http.ResponseWriter, r *http.Request) {
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

	if req.ID == 0 && req.Slug == "" && req.Name == "" {
		h.errJson(w, http.StatusBadRequest, "Invalid request: Missing ID, Slug or Name")
		return
	}

	adminProductDetailResponse, err := h.PrtController.AdminGetProductController(req)
	if err != nil {
		h.errJson(w, http.StatusNotFound, "Product Not Found")
		return
	}

	h.writeJson(w, http.StatusOK, adminProductDetailResponse)
}

// UserGetProductHandlerDetail - Lấy chi tiết cho User
func (h *productHandler) UserGetProductHandlerDetail(w http.ResponseWriter, r *http.Request) {

	idStr := r.PathValue("id")             // Ưu tiên lấy ID từ URL path đẹp (/products/123)
	queryID := r.URL.Query().Get("id")     // Fallback lấy từ query param (?id=123)
	nameStr := r.URL.Query().Get("name")   // Tìm theo tên
	brandStr := r.URL.Query().Get("brand") // [BẠN CỦA BẠN THÊM]: Tìm theo brand nếu cần

	var parsedErr error
	req := &model.GetProductRequest{}

	// 1. Xử lý ID (Path hoặc Query)
	if idStr != "" {
		req.ID, parsedErr = strconv.ParseInt(idStr, 10, 64)
	} else if queryID != "" {
		req.ID, parsedErr = strconv.ParseInt(queryID, 10, 64)
	} else if r.PathValue("slug") != "" {
		req.Slug = r.PathValue("slug")
	}

	if parsedErr != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	// 2. Nếu có ID hoặc Slug -> Gọi Controller lấy chi tiết
	if req.ID != 0 || req.Slug != "" {
		userProductDetailResponse, err := h.PrtController.UserGetProductDetailController(req)
		if err != nil {
			h.errJson(w, http.StatusNotFound, "Product Not Found")
			return
		}
		h.writeJson(w, http.StatusOK, userProductDetailResponse)
		return
	}

	if nameStr != "" || brandStr != "" {
		searchReq := &model.SearchProductsRequest{
			Search: nameStr,
			Brand:  brandStr,
		}
		productsResponse, err := h.PrtController.UserSearchProductByNameController(searchReq)
		if err != nil {
			h.errJson(w, http.StatusInternalServerError, err.Error())
			return
		}
		if len(productsResponse.Products) == 0 {
			h.errJson(w, http.StatusNotFound, "No products found")
			return
		}
		h.writeJson(w, http.StatusOK, productsResponse)
		return
	}

	h.errJson(w, http.StatusBadRequest, "At least one parameter (id, slug, name, or brand) is required")
}

// UserGetProductHandler - Lấy thông tin rút gọn (cho thẻ sản phẩm)
func (h *productHandler) UserGetProductHandler(w http.ResponseWriter, r *http.Request) {
	// Đọc từ query parameters
	idStr := r.URL.Query().Get("id")
	nameStr := r.URL.Query().Get("name")
	var parsedErr error

	req := &model.GetProductRequest{}
	if idStr != "" {
		req.ID, parsedErr = strconv.ParseInt(idStr, 10, 64)
	} else if nameStr != "" {
		req.Name = nameStr
	}
	if parsedErr != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	// Kiểm tra ít nhất 1 tham số
	if req.ID == 0 && req.Name == "" {
		h.errJson(w, http.StatusBadRequest, "At least one parameter (id or name) is required")
		return
	}

	userProductDetailResponse, err := h.PrtController.UserGetProductController(req)
	if err != nil {
		h.errJson(w, http.StatusNotFound, "Product Not Found")
		return
	}

	h.writeJson(w, http.StatusOK, userProductDetailResponse)
}

// UserSearchProductHandler - Tìm kiếm cho User

func (h *productHandler) UserSearchProductHandler(w http.ResponseWriter, r *http.Request) {

	searchParam := r.URL.Query().Get("name")          // ?name=Samsung
	brandParam := r.URL.Query().Get("brand")          // ?brand=Apple
	categoryIDStr := r.URL.Query().Get("category_id") // ?category_id=1

	var categoryID int64 = 0
	if categoryIDStr != "" {
		parsedID, err := strconv.ParseInt(categoryIDStr, 10, 64)
		if err != nil {
			h.errJson(w, http.StatusBadRequest, "Invalid category_id format")
			return
		}
		categoryID = parsedID
	}

	// [VALIDATION]: Ít nhất phải có 1 tham số tìm kiếm
	if searchParam == "" && brandParam == "" && categoryID == 0 {
		h.errJson(w, http.StatusBadRequest, "At least one search parameter (name, brand, or category_id) is required")
		return
	}

	req := &model.SearchProductsRequest{
		Search:     searchParam,
		Brand:      brandParam,
		CategoryID: categoryID,
	}

	// Validate struct nếu cần (tùy logic validator của bạn)
	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	productsResponse, err := h.PrtController.UserSearchProductByNameController(req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminSearchProductsHandler - Tìm kiếm cho Admin (All status)
func (h *productHandler) AdminSearchProductsHandler(w http.ResponseWriter, r *http.Request) {

	searchParam := r.URL.Query().Get("name")
	brandParam := r.URL.Query().Get("brand")
	categoryIDStr := r.URL.Query().Get("category_id")

	var categoryID int64 = 0
	if categoryIDStr != "" {
		parsedID, err := strconv.ParseInt(categoryIDStr, 10, 64)
		if err != nil {
			h.errJson(w, http.StatusBadRequest, "Invalid category_id format")
			return
		}
		categoryID = parsedID
	}

	if searchParam == "" && brandParam == "" && categoryID == 0 {
		h.errJson(w, http.StatusBadRequest, "At least one search parameter (name, brand, or category_id) is required")
		return
	}

	req := &model.SearchProductsRequest{
		Search:     searchParam,
		Brand:      brandParam,
		CategoryID: categoryID,
	}

	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	productsResponse, err := h.PrtController.AdminSearchProductsController(req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminGetManyProductController - Lấy nhiều SP theo IDs
func (h *productHandler) AdminGetManyProductHandler(w http.ResponseWriter, r *http.Request) {
	var req model.GetManyProductsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if err := validator.Validate(req); err != nil {
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

// AdminGetAllProductHandler - Lấy tất cả (trừ xóa mềm)
func (h *productHandler) AdminGetAllProductHandler(w http.ResponseWriter, r *http.Request) {
	productsResponse, err := h.PrtController.AdminGetAllProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminDeleteSoftProductHandler - Xóa mềm 1 SP
func (h *productHandler) AdminDeleteSoftProductHandler(w http.ResponseWriter, r *http.Request) {
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

// AdminBulkDeleteSoftProductsHandler - Xóa mềm nhiều SP (Cập nhật logic)
func (h *productHandler) AdminBulkDeleteSoftProductsHandler(w http.ResponseWriter, r *http.Request) {

	err := h.PrtController.AdminDeleteAllSoftDeletedProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Cannot delete products")
		return
	}
	h.writeJson(w, http.StatusOK, map[string]string{"message": "Action completed successfully"})
}

// AdminGetAllSoftDeletedProductsHandler - Lấy list đã xóa mềm
func (h *productHandler) AdminGetAllSoftDeletedProductsHandler(w http.ResponseWriter, r *http.Request) {
	productsResponse, err := h.PrtController.AdminGetAllSoftDeletedProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminDeleteAllProductsHandler - Xóa cứng tất cả (Nguy hiểm)
func (h *productHandler) AdminDeleteAllProductsHandler(w http.ResponseWriter, r *http.Request) {
	err := h.PrtController.AdminDeleteAllProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Cannot delete all products")
		return
	}
	h.writeJson(w, http.StatusOK, map[string]string{"message": "All products deleted successfully"})
}
