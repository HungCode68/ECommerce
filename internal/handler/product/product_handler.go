package product

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"golang/internal/controller/product"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
	"strings"
)

func parsePaginationParams(r *http.Request) (page int, limit int, sortBy string, sortOrder string) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	sortBy = r.URL.Query().Get("sort_by")
	sortOrder = r.URL.Query().Get("sort_order")

	page = 1
	limit = 20
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	return
}

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

// AdminImportProductsCSVHandler - API lấy file CSV và map thành đối tượng
func (h *productHandler) AdminImportProductsCSVHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil { // Max 10MB
		h.errJson(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	file, _, err := r.FormFile("csv_file")
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Missing 'csv_file' in form-data")
		return
	}
	defer file.Close()

	csvReader := csv.NewReader(file)
	records, err := csvReader.ReadAll()
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Failed to read CSV file")
		return
	}

	if len(records) < 2 {
		h.errJson(w, http.StatusBadRequest, "CSV file is empty or missing data rows")
		return
	}

	var reqs []model.CreateProductRequest
	for i, row := range records {
		if i == 0 {
			continue // Skip dòng tiêu đề
		}
		
		// Dự kiến 9 cột: Name, Slug, MinPrice, DiscountPercent, ShortDescription, Description, Brand, Status, CategoryIDs
		if len(row) < 9 {
			h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Row %d: Missing columns (expected at least 9)", i+1))
			return
		}

		minPrice, _ := strconv.ParseFloat(strings.TrimSpace(row[2]), 64)
		discountPercent, _ := strconv.ParseFloat(strings.TrimSpace(row[3]), 64)
		isPublished := true // Mặc định true
		
		var categoryIDs []int64
		catStr := strings.TrimSpace(row[8])
		if catStr != "" {
			parts := strings.Split(catStr, ";")
			for _, part := range parts {
				id, _ := strconv.ParseInt(strings.TrimSpace(part), 10, 64)
				if id > 0 {
					categoryIDs = append(categoryIDs, id)
				}
			}
		}

		req := model.CreateProductRequest{
			Name:             strings.TrimSpace(row[0]),
			Slug:             strings.TrimSpace(row[1]),
			MinPrice:         minPrice,
			DiscountPercent:  discountPercent,
			ShortDescription: strings.TrimSpace(row[4]),
			Description:      strings.TrimSpace(row[5]),
			Brand:            strings.TrimSpace(row[6]),
			Status:           strings.TrimSpace(row[7]),
			IsPublished:      isPublished,
			CategoryIDs:      categoryIDs,
		}
		reqs = append(reqs, req)
	}

	response, err := h.PrtController.AdminImportProductsController(reqs)
	if err != nil {
		h.errJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	if len(response.Errors) > 0 {
		h.writeJson(w, http.StatusBadRequest, response) // Trả JSON errors về cho Client hiển thị
		return
	}

	h.writeJson(w, http.StatusCreated, response)
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

	adminReponse, err := h.PrtController.UpdateProductController(r.Context(), req, id)
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
	minPriceStr := r.URL.Query().Get("min_price")     // ?min_price=50
	maxPriceStr := r.URL.Query().Get("max_price")     // ?max_price=200

	var categoryID int64 = 0
	if categoryIDStr != "" {
		parsedID, err := strconv.ParseInt(categoryIDStr, 10, 64)
		if err != nil {
			h.errJson(w, http.StatusBadRequest, "Invalid category_id format")
			return
		}
		categoryID = parsedID
	}

	var minPrice, maxPrice *float64
	if minPriceStr != "" {
		v, err := strconv.ParseFloat(minPriceStr, 64)
		if err != nil || v < 0 {
			h.errJson(w, http.StatusBadRequest, "Invalid min_price: must be a non-negative number")
			return
		}
		minPrice = &v
	}
	if maxPriceStr != "" {
		v, err := strconv.ParseFloat(maxPriceStr, 64)
		if err != nil || v < 0 {
			h.errJson(w, http.StatusBadRequest, "Invalid max_price: must be a non-negative number")
			return
		}
		maxPrice = &v
	}
	if minPrice != nil && maxPrice != nil && *maxPrice < *minPrice {
		h.errJson(w, http.StatusBadRequest, "max_price must be greater than or equal to min_price")
		return
	}

	// [VALIDATION]: Ít nhất phải có 1 tham số tìm kiếm
	if searchParam == "" && brandParam == "" && categoryID == 0 && minPrice == nil && maxPrice == nil {
		h.errJson(w, http.StatusBadRequest, "At least one search parameter (name, brand, category_id, min_price, or max_price) is required")
		return
	}

	page, limit, sortBy, sortOrder := parsePaginationParams(r)

	req := &model.SearchProductsRequest{
		Search:         searchParam,
		Brand:          brandParam,
		CategoryID:     categoryID,
		MinPriceFilter: minPrice,
		MaxPriceFilter: maxPrice,
		Page:           page,
		Limit:          limit,
		SortBy:         sortBy,
		SortOrder:      sortOrder,
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
	minPriceStr := r.URL.Query().Get("min_price")
	maxPriceStr := r.URL.Query().Get("max_price")

	var categoryID int64 = 0
	if categoryIDStr != "" {
		parsedID, err := strconv.ParseInt(categoryIDStr, 10, 64)
		if err != nil {
			h.errJson(w, http.StatusBadRequest, "Invalid category_id format")
			return
		}
		categoryID = parsedID
	}

	var minPrice, maxPrice *float64
	if minPriceStr != "" {
		v, err := strconv.ParseFloat(minPriceStr, 64)
		if err != nil || v < 0 {
			h.errJson(w, http.StatusBadRequest, "Invalid min_price: must be a non-negative number")
			return
		}
		minPrice = &v
	}
	if maxPriceStr != "" {
		v, err := strconv.ParseFloat(maxPriceStr, 64)
		if err != nil || v < 0 {
			h.errJson(w, http.StatusBadRequest, "Invalid max_price: must be a non-negative number")
			return
		}
		maxPrice = &v
	}
	if minPrice != nil && maxPrice != nil && *maxPrice < *minPrice {
		h.errJson(w, http.StatusBadRequest, "max_price must be greater than or equal to min_price")
		return
	}

	if searchParam == "" && brandParam == "" && categoryID == 0 && minPrice == nil && maxPrice == nil {
		h.errJson(w, http.StatusBadRequest, "At least one search parameter (name, brand, category_id, min_price, or max_price) is required")
		return
	}

	page, limit, sortBy, sortOrder := parsePaginationParams(r)

	req := &model.SearchProductsRequest{
		Search:         searchParam,
		Brand:          brandParam,
		CategoryID:     categoryID,
		MinPriceFilter: minPrice,
		MaxPriceFilter: maxPrice,
		Page:           page,
		Limit:          limit,
		SortBy:         sortBy,
		SortOrder:      sortOrder,
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
	page, limit, sortBy, sortOrder := parsePaginationParams(r)
	req := &model.SearchProductsRequest{
		Page:      page,
		Limit:     limit,
		SortBy:    sortBy,
		SortOrder: sortOrder,
	}
	productsResponse, err := h.PrtController.AdminGetAllProductsController(req)
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
