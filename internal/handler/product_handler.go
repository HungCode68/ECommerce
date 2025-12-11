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

type ProductHandler struct {
	PrtController *controller.ProductController
}

func NewProductHandler(prtController *controller.ProductController) *ProductHandler {
	return &ProductHandler{PrtController: prtController}
}

// Helper functions
func (h *ProductHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
func (h *ProductHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

//CreateProduct

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

// Get Product
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
func (h *ProductHandler) AdminGetAllProductHandler(w http.ResponseWriter, r *http.Request) {
	productsResponse, err := h.PrtController.AdminGetAllProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}
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

func (h *ProductHandler) AdminGetAllSoftDeletedProductsHandler(w http.ResponseWriter, r *http.Request) {
	productsResponse, err := h.PrtController.AdminGetAllSoftDeletedProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJson(w, http.StatusOK, productsResponse)
}
func (h *ProductHandler) AdminBulkDeleteSoftProductsHandler(w http.ResponseWriter, r *http.Request) {
	err := h.PrtController.AdminDeleteAllSoftDeletedProductsController()
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, "Cannot delete all products")
	}
	h.writeJson(w, http.StatusOK, map[string]string{"message": "All products deleted softly successfully"})

}
