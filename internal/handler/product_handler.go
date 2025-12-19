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

// writeJson - Ghi response JSON với status code và data
func (h *ProductHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}


func (h *ProductHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}



// CreateProductHandler - Tạo sản phẩm mới

func (h *ProductHandler) CreateProductHandler(w http.ResponseWriter, r *http.Request) {
	var req model.CreateProductRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
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

// UpdateProductHandler - Cập nhật sản phẩm
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


// AdminGetProductHandler - Lấy chi tiết cho Admin

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

	h.writeJson(w, http.StatusOK, adminProductDetailResponse)
}

// UserGetProductHandlerDetail - Lấy chi tiết cho User
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

	h.writeJson(w, http.StatusOK, userProductDetailResponse)
}

// UserGetProductHandler - Lấy thông tin rút gọn (cho thẻ sản phẩm)
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

	h.writeJson(w, http.StatusOK, userProductDetailResponse)
}


// UserSearchProductHandler - Tìm kiếm cho User

func (h *ProductHandler) UserSearchProductHandler(w http.ResponseWriter, r *http.Request) {
	var req model.SearchProductsRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	
	if err := validator.NewCustomValidator().Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}


	if req.Search == "" && req.Brand == "" && req.CategoryID == 0 {
		h.errJson(w, http.StatusBadRequest, "At least one search parameter (search, brand, or category_id) is required")
		return
	}

	
	productsResponse, err := h.PrtController.UserSearchProductByNameController(&req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminSearchProductsHandler - Tìm kiếm cho Admin (All status)
func (h *ProductHandler) AdminSearchProductsHandler(w http.ResponseWriter, r *http.Request) {
	var req model.SearchProductsRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if err := validator.NewCustomValidator().Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}


	if req.Search == "" && req.Brand == "" && req.CategoryID == 0 {
		h.errJson(w, http.StatusBadRequest, "At least one search parameter (search, brand, or category_id) is required")
		return
	}

	productsResponse, err := h.PrtController.AdminSearchProductsController(&req)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminGetManyProductController - Lấy nhiều SP theo IDs
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

// AdminGetAllProductHandler - Lấy tất cả (trừ xóa mềm)
func (h *ProductHandler) AdminGetAllProductHandler(w http.ResponseWriter, r *http.Request) {
	productsResponse, err := h.PrtController.AdminGetAllProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}


// AdminDeleteSoftProductHandler - Xóa mềm 1 SP
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

// AdminBulkDeleteSoftProductsHandler - Xóa mềm nhiều SP (Cập nhật logic)
func (h *ProductHandler) AdminBulkDeleteSoftProductsHandler(w http.ResponseWriter, r *http.Request) {
	

	err := h.PrtController.AdminDeleteAllSoftDeletedProductsController() 
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Cannot delete products")
		return
	}
	h.writeJson(w, http.StatusOK, map[string]string{"message": "Action completed successfully"})
}

// AdminGetAllSoftDeletedProductsHandler - Lấy list đã xóa mềm
func (h *ProductHandler) AdminGetAllSoftDeletedProductsHandler(w http.ResponseWriter, r *http.Request) {
	productsResponse, err := h.PrtController.AdminGetAllSoftDeletedProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}

// AdminDeleteAllProductsHandler - Xóa cứng tất cả (Nguy hiểm)
func (h *ProductHandler) AdminDeleteAllProductsHandler(w http.ResponseWriter, r *http.Request) {
	err := h.PrtController.AdminDeleteAllProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Cannot delete all products")
		return
	}
	h.writeJson(w, http.StatusOK, map[string]string{"message": "All products deleted successfully"})
}