package controller

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	"golang/internal/repository"
	"time"

	"github.com/gosimple/slug"
)

type ProductController struct {
	Repo         repository.ProductResponsitory
	RepoVariants repository.ProductVariantsRepository // [MỚI] Thêm Repo Variants từ code bạn của bạn
}

// Constructor gộp: Nhận cả 2 Repo
func NewProductController(repo repository.ProductResponsitory, repoVariants repository.ProductVariantsRepository) *ProductController {
	return &ProductController{
		Repo:         repo,
		RepoVariants: repoVariants,
	}
}

// =================================================================
// HELPER FUNCTIONS
// =================================================================

func stringToPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// =================================================================
// 1. CREATE PRODUCT
// =================================================================

// CreateProductController - Dùng Logic của BẠN (Tốt hơn vì có Slug Loop & Categories)
func (prt *ProductController) CreateProductController(product model.CreateProductRequest) (*model.AdminCreateProductResponse, error) {
	// 1. Check trùng tên
	existingByName, err := prt.Repo.GetConflictProductByName(product.Name)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if existingByName {
		return nil, fmt.Errorf("Product name already exists")
	}

	// 2. Logic tự sinh Slug & Check trùng (Loop)
	finalSlug := product.Slug
	if finalSlug == "" {
		finalSlug = slug.Make(product.Name)
	} else {
		finalSlug = slug.Make(finalSlug)
	}

	originalSlug := finalSlug
	counter := 1

	for {
		isExist, err := prt.Repo.GetConflictProductBySlug(finalSlug)
		if err != nil && err != sql.ErrNoRows {
			return nil, err
		}
		if !isExist {
			break
		}
		finalSlug = fmt.Sprintf("%s-%d", originalSlug, counter)
		counter++
		if counter > 100 {
			return nil, fmt.Errorf("không thể tạo slug duy nhất, vui lòng nhập tay")
		}
	}

	// 3. Xử lý ngày published
	var publishedAt *time.Time
	if product.PublishedAt != "" {
		parsedTime, err := time.Parse(time.RFC3339, product.PublishedAt)
		if err != nil {
			return nil, err
		}
		publishedAt = &parsedTime
	}

	// 4. Tạo struct
	productToCreate := &model.Product{
		Name:             product.Name,
		Slug:             finalSlug,
		ShortDescription: stringToPtr(product.ShortDescription),
		Description:      stringToPtr(product.Description),
		Brand:            stringToPtr(product.Brand),
		Status:           product.Status,
		IsPublished:      product.IsPublished,
		PublishedAt:      publishedAt,
		MinPrice:         product.MinPrice,
	}

	// 5. Gọi Repo Create (Kèm CategoryIDs)
	createdProduct, err := prt.Repo.CreateProduct(productToCreate, product.CategoryIDs)
	if err != nil {
		return nil, err
	}

	// 6. Fetch lại Categories để hiển thị
	cats, err := prt.Repo.GetCategoriesByProductID(createdProduct.ID)
	if err == nil {
		createdProduct.Categories = cats
	}

	return &model.AdminCreateProductResponse{
		Message: "Product created successfully",
		Product: model.AdminProductResponse{
			ID:               createdProduct.ID,
			Name:             createdProduct.Name,
			Slug:             createdProduct.Slug,
			ShortDescription: createdProduct.ShortDescription,
			Description:      createdProduct.Description,
			Brand:            createdProduct.Brand,
			Status:           createdProduct.Status,
			IsPublished:      createdProduct.IsPublished,
			PublishedAt:      createdProduct.PublishedAt,
			MinPrice:         createdProduct.MinPrice,
			CreatedAt:        createdProduct.CreatedAt,
			UpdatedAt:        createdProduct.UpdatedAt,
			Categories:       createdProduct.Categories, // Có Categories
		},
	}, nil
}

// =================================================================
// PRIVATE HELPER - Tìm kiếm sản phẩm
// =================================================================

// getProductCommon - Dùng Logic của BẠN (Có lấy Categories)
func (prt *ProductController) getProductCommon(reqProduct *model.GetProductRequest) (*model.Product, error) {
	if reqProduct.ID == 0 && reqProduct.Name == "" && reqProduct.Slug == "" {
		return nil, fmt.Errorf("at least one search parameter (id, name, or slug) is required")
	}

	var (
		pro *model.Product
		err error
	)

	if reqProduct.ID != 0 {
		pro, err = prt.Repo.GetProductByID(reqProduct.ID)
	} else if reqProduct.Slug != "" {
		pro, err = prt.Repo.GetProductBySlug(reqProduct.Slug)
	} else if reqProduct.Name != "" {
		pro, err = prt.Repo.GetProductByName(reqProduct.Name)
	}

	if err != nil {
		return nil, fmt.Errorf("database query failed: %w", err)
	}

	// Fetch Categories (Logic của bạn)
	cats, err := prt.Repo.GetCategoriesByProductID(pro.ID)
	if err == nil {
		pro.Categories = cats
	}

	return pro, nil
}

// =================================================================
// ADMIN GET DETAIL
// =================================================================

// AdminGetProductController - [GỘP]: Product + Categories + Variants
func (prt *ProductController) AdminGetProductController(reqProduct *model.GetProductRequest) (*model.AdminProductDetailResponse, error) {
	// 1. Lấy Product & Categories
	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}

	// 2. [MỚI] Lấy Variants (Logic của bạn bạn)
	variantsModel, err := prt.RepoVariants.GetProductVariantByID(pro.ID)
	if err != nil {
		variantsModel = []model.ProductsVariants{}
	}

	// 3. Map Variants & Tính MinPrice
	variantResponses := make([]model.AdminVariantResponse, 0, len(variantsModel))
	minPrice := pro.MinPrice // Mặc định lấy giá gốc
	hasActiveVariants := false

	for _, v := range variantsModel {
		variantResponses = append(variantResponses, model.AdminVariantResponse{
			ID:             v.ID,
			ProductID:      v.ProductID,
			SKU:            v.SKU,
			Title:          v.Title,
			OptionValues:   v.OptionValues,
			PriceOverride:  v.PriceOverride,
			CostPrice:      v.CostPrice,
			StockQuantity:  v.StockQuantity,
			AllowBackorder: v.AllowBackorder,
			IsActive:       v.IsActive,
			CreatedAt:      v.CreatedAt.String(),
			UpdatedAt:      v.UpdatedAt.String(),
		})

		// Logic tính giá nhỏ nhất từ biến thể active
		if v.IsActive && v.PriceOverride != nil {
			if !hasActiveVariants || *v.PriceOverride < minPrice {
				minPrice = *v.PriceOverride
				hasActiveVariants = true
			}
		}
	}

	return &model.AdminProductDetailResponse{
		Message: "Product retrieved successfully",
		Product: model.AdminProductResponse{
			ID:               pro.ID,
			Name:             pro.Name,
			Slug:             pro.Slug,
			ShortDescription: pro.ShortDescription,
			Description:      pro.Description,
			Brand:            pro.Brand,
			Status:           pro.Status,
			IsPublished:      pro.IsPublished,
			PublishedAt:      pro.PublishedAt,
			MinPrice:         minPrice, // Dùng giá đã tính toán lại
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
			Categories:       pro.Categories, // Trả về Categories
		},
		Variants: variantResponses, // Trả về Variants
	}, nil
}

// =================================================================
// USER GET DETAIL
// =================================================================

// UserGetProductDetailController - [GỘP]: Filter Active Categories + Filter Active Variants
func (prt *ProductController) UserGetProductDetailController(reqProduct *model.GetProductRequest) (*model.UserProductDetailResponse, error) {
	// 1. Lấy Product & Categories
	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}

	if !pro.IsPublished {
		return nil, fmt.Errorf("product not available")
	}

	// 2. [LOGIC BẠN]: Lọc Categories Active
	activeCategories := []model.Category{}
	if pro.Categories != nil {
		for _, cat := range pro.Categories {
			if cat.IsActive {
				activeCategories = append(activeCategories, cat)
			}
		}
	}
	pro.Categories = activeCategories

	// 3. [LOGIC BẠN BẠN]: Lấy Variants & Tính MinPrice
	variantsModel, err := prt.RepoVariants.GetProductVariantByID(pro.ID)
	if err != nil {
		variantsModel = []model.ProductsVariants{}
	}

	variantResponses := make([]model.UserVariantResponse, 0)
	minPrice := pro.MinPrice
	hasActiveVariants := false

	for _, v := range variantsModel {
		if v.IsActive { // Chỉ lấy Active Variant
			resp := model.UserVariantResponse{
				StockQuantity: v.StockQuantity,
				// Nhớ map thêm Title/Color/Size nếu Model có
			}
			if v.Title != nil {
				resp.Title = *v.Title
			}
			if v.OptionValues != nil {
				resp.OptionValues = *v.OptionValues
			}

			// Xử lý giá
			if v.PriceOverride != nil {
				resp.Price = *v.PriceOverride
				if !hasActiveVariants || *v.PriceOverride < minPrice {
					minPrice = *v.PriceOverride
					hasActiveVariants = true
				}
			} else {
				resp.Price = pro.MinPrice
			}
			variantResponses = append(variantResponses, resp)
		}
	}

	return &model.UserProductDetailResponse{
		Message:          "Product retrieved successfully",
		ID:               pro.ID,
		Name:             pro.Name,
		ShortDescription: pro.ShortDescription,
		Description:      pro.Description,
		Brand:            pro.Brand,
		MinPrice:         minPrice, // Giá hiển thị là giá thấp nhất tìm thấy
		AvgRating:        pro.AvgRating,
		RatingCount:      pro.RatingCount,
		PublishedAt:      pro.PublishedAt,
		Categories:       pro.Categories,   // Categories (Filtered)
		Variants:         variantResponses, // Variants (Filtered)
	}, nil
}

// =================================================================
// UPDATE PRODUCT
// =================================================================

// UpdateProductController - Dùng Logic của BẠN (Update được Categories & Pointer Fields)
func (prt *ProductController) UpdateProductController(req model.UpdateProductRequest, id int64) (*model.AdminUpdateProductResponse, error) {
	existingProduct, err := prt.Repo.GetProductByID(id)
	if err != nil {
		return nil, fmt.Errorf("Product not found")
	}

	// Xử lý logic SLUG
	finalSlug := existingProduct.Slug
	if req.Slug != "" {
		newSlug := slug.Make(req.Slug)
		if newSlug != existingProduct.Slug {
			isConflict, err := prt.Repo.GetConflictProductBySlug(newSlug)
			if err != nil && err != sql.ErrNoRows {
				return nil, err
			}
			if isConflict {
				return nil, fmt.Errorf("Slug '%s' already exists", newSlug)
			}
			finalSlug = newSlug
		}
	}

	// Helper merge pointer
	mergeStringPtr := func(newVal string, oldVal *string) *string {
		if newVal != "" {
			return &newVal
		}
		return oldVal
	}

	finalName := existingProduct.Name
	if req.Name != "" {
		finalName = req.Name
	}

	finalMinPrice := existingProduct.MinPrice
	if req.MinPrice != nil {
		finalMinPrice = *req.MinPrice
	}

	finalIsPublished := existingProduct.IsPublished
	if req.IsPublished != nil {
		finalIsPublished = *req.IsPublished
	}

	var finalPublishedAt = existingProduct.PublishedAt
	if req.PublishedAt != "" {
		parsedTime, err := time.Parse(time.RFC3339, req.PublishedAt)
		if err != nil {
			return nil, err
		}
		finalPublishedAt = &parsedTime
	}

	productToUpdate := &model.Product{
		ID:               id,
		Name:             finalName,
		Slug:             finalSlug,
		ShortDescription: mergeStringPtr(req.ShortDescription, existingProduct.ShortDescription),
		Description:      mergeStringPtr(req.Description, existingProduct.Description),
		Brand:            mergeStringPtr(req.Brand, existingProduct.Brand),
		Status:           req.Status,
		IsPublished:      finalIsPublished,
		PublishedAt:      finalPublishedAt,
		MinPrice:         finalMinPrice,
		UpdatedAt:        time.Now(),
	}

	if productToUpdate.Status == "" {
		productToUpdate.Status = existingProduct.Status
	}

	// Update Product & Categories
	updatedProduct, err := prt.Repo.UpdateProduct(productToUpdate, req.CategoryIDs)
	if err != nil {
		return nil, err
	}

	// Fetch lại Categories
	cats, err := prt.Repo.GetCategoriesByProductID(updatedProduct.ID)
	if err == nil {
		updatedProduct.Categories = cats
	}

	reponse := &model.AdminProductResponse{
		ID:               updatedProduct.ID,
		Name:             updatedProduct.Name,
		Slug:             updatedProduct.Slug,
		ShortDescription: updatedProduct.ShortDescription,
		Description:      updatedProduct.Description,
		Brand:            updatedProduct.Brand,
		Status:           updatedProduct.Status,
		IsPublished:      updatedProduct.IsPublished,
		PublishedAt:      updatedProduct.PublishedAt,
		MinPrice:         updatedProduct.MinPrice,
		AvgRating:        updatedProduct.AvgRating,
		RatingCount:      updatedProduct.RatingCount,
		CreatedBy:        existingProduct.CreatedBy,
		UpdatedBy:        updatedProduct.UpdatedBy,
		CreatedAt:        existingProduct.CreatedAt,
		UpdatedAt:        updatedProduct.UpdatedAt,
		DeletedAt:        updatedProduct.DeletedAt,
		Categories:       updatedProduct.Categories,
	}

	return &model.AdminUpdateProductResponse{
		Message: "Product updated successfully",
		Product: *reponse,
	}, nil
}

// =================================================================
// OTHER CONTROLLERS (LIST, DELETE, SEARCH) - Dùng Logic của BẠN
// =================================================================

func (prt *ProductController) AdminGetAllProductsController() (*model.AdminProductListResponse, error) {
	products, err := prt.Repo.GetAllProducts()
	if err != nil {
		return nil, err
	}
	// Convert logic như cũ...
	var responses []model.AdminProductResponse
	for _, pro := range products {
		responses = append(responses, model.AdminProductResponse{
			ID:               pro.ID,
			Name:             pro.Name,
			Slug:             pro.Slug,
			ShortDescription: pro.ShortDescription,
			Description:      pro.Description,
			Brand:            pro.Brand,
			Status:           pro.Status,
			IsPublished:      pro.IsPublished,
			PublishedAt:      pro.PublishedAt,
			MinPrice:         pro.MinPrice,
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
			Categories:       pro.Categories,
		})
	}
	return &model.AdminProductListResponse{
		Message:  "Products retrieved successfully",
		Products: responses,
	}, nil
}

func (prt *ProductController) UserGetAllProductsController() (*model.UserProductListResponse, error) {
	products, err := prt.Repo.GetAllProducts()
	if err != nil {
		return nil, err
	}
	var responses []model.UserProductResponse
	for _, pro := range products {
		if !pro.IsPublished {
			continue
		}
		responses = append(responses, model.UserProductResponse{
			ID:       pro.ID,
			Name:     pro.Name,
			Brand:    pro.Brand,
			MinPrice: pro.MinPrice,
		})
	}
	return &model.UserProductListResponse{
		Message:  "Products retrieved successfully",
		Products: responses,
	}, nil
}

// UserSearchProductByNameController
func (prt *ProductController) UserSearchProductByNameController(req *model.SearchProductsRequest) (*model.UserProductListResponse, error) {
	products, err := prt.Repo.SearchProducts(req)
	if err != nil {
		return nil, err
	}
	var res []model.UserProductResponse
	for _, pro := range products {
		if !pro.IsPublished {
			continue
		}
		res = append(res, model.UserProductResponse{
			ID:       pro.ID,
			Name:     pro.Name,
			Brand:    pro.Brand,
			MinPrice: pro.MinPrice,
		})
	}
	return &model.UserProductListResponse{
		Message:  "Products retrieved successfully",
		Products: res,
	}, nil
}

// AdminSearchProductsController
func (prt *ProductController) AdminSearchProductsController(req *model.SearchProductsRequest) (*model.AdminProductListResponse, error) {
	products, err := prt.Repo.SearchProducts(req)
	if err != nil {
		return nil, fmt.Errorf("failed to search products: %w", err)
	}
	var adminProducts []model.AdminProductResponse
	for _, pro := range products {
		adminProducts = append(adminProducts, model.AdminProductResponse{
			ID:               pro.ID,
			Name:             pro.Name,
			Slug:             pro.Slug,
			ShortDescription: pro.ShortDescription,
			Description:      pro.Description,
			Brand:            pro.Brand,
			Status:           pro.Status,
			IsPublished:      pro.IsPublished,
			PublishedAt:      pro.PublishedAt,
			MinPrice:         pro.MinPrice,
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
			Categories:       pro.Categories,
		})
	}
	return &model.AdminProductListResponse{
		Message:  "Products retrieved successfully",
		Products: adminProducts,
	}, nil
}

// AdminGetManyProductByIDController
func (prt *ProductController) AdminGetManyProductByIDController(ids []int64) ([]model.AdminProductResponse, error) {
	products, err := prt.Repo.GetManyProduct(ids)
	if err != nil {
		return nil, err
	}
	var responses []model.AdminProductResponse
	for _, pro := range products {
		responses = append(responses, model.AdminProductResponse{
			ID:               pro.ID,
			Name:             pro.Name,
			Slug:             pro.Slug,
			ShortDescription: pro.ShortDescription,
			Description:      pro.Description,
			Brand:            pro.Brand,
			Status:           pro.Status,
			IsPublished:      pro.IsPublished,
			PublishedAt:      pro.PublishedAt,
			MinPrice:         pro.MinPrice,
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
		})
	}
	return responses, nil
}

// UserGetProductController (Simple)
func (prt *ProductController) UserGetProductController(reqProduct *model.GetProductRequest) (*model.UserProductResponse, error) {
	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}
	if !pro.IsPublished {
		return nil, fmt.Errorf("product not available")
	}
	return &model.UserProductResponse{
		ID:       pro.ID,
		Name:     pro.Name,
		Brand:    pro.Brand,
		MinPrice: pro.MinPrice,
	}, nil
}

// Các hàm Soft Delete / Hard Delete (Giữ nguyên của BẠN)
func (prt *ProductController) AdminDeleteSoftProductController(id int64) error {
	return prt.Repo.DeleteSoftProduct(id)
}

func (prt *ProductController) AdminGetAllSoftDeletedProductsController() (*model.AdminProductListResponse, error) {
	products, err := prt.Repo.GetAllProductsSoftDeleted()
	if err != nil {
		return nil, err
	}
	var responses []model.AdminProductResponse
	for _, pro := range products {
		responses = append(responses, model.AdminProductResponse{
			ID:               pro.ID,
			Name:             pro.Name,
			Slug:             pro.Slug,
			ShortDescription: pro.ShortDescription,
			Description:      pro.Description,
			Brand:            pro.Brand,
			Status:           pro.Status,
			IsPublished:      pro.IsPublished,
			PublishedAt:      pro.PublishedAt,
			MinPrice:         pro.MinPrice,
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
		})
	}
	return &model.AdminProductListResponse{
		Message:  "Soft deleted products retrieved successfully",
		Products: responses,
	}, nil
}

func (prt *ProductController) AdminDeleteAllSoftDeletedProductsController() error {
	return prt.Repo.DeleteAllProductsSoftDeleted()
}

func (prt *ProductController) AdminDeleteAllProductsController() error {
	return prt.Repo.DeleteAllProducts()
}