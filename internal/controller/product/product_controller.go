package product

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"golang/internal/middleware"
	"golang/internal/model"
	product "golang/internal/repository/product"
	producthistory "golang/internal/repository/producthistory"
	productreview "golang/internal/repository/productreview"
	productVariant "golang/internal/repository/productvariant"
	"time"

	"github.com/gosimple/slug"
)

type productController struct {
	Repo         product.ProductRepository
	RepoVariants productVariant.ProductVariantsRepository
	HistoryRepo  producthistory.ProductHistoryRepository
	ReviewRepo   productreview.ProductReviewRepository
}

// NewProductController - Khởi tạo product controller
func NewProductController(repo product.ProductRepository, repoVariants productVariant.ProductVariantsRepository, repoHistory producthistory.ProductHistoryRepository, repoReview productreview.ProductReviewRepository) ProductController {
	return &productController{
		Repo:         repo,
		RepoVariants: repoVariants,
		HistoryRepo:  repoHistory,
		ReviewRepo:   repoReview,
	}
}

// stringToPtr - Chuyển đổi string thành con trỏ, trả về nil nếu rỗng
func stringToPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func calcFinalPrice(minPrice, discountPercent float64) float64 {
	return minPrice * (1 - discountPercent/100)
}

func buildPaginationMeta(req *model.SearchProductsRequest, total int) *model.PaginationMeta {
	page := req.Page
	limit := req.Limit
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	totalPages := total / limit
	if total%limit > 0 {
		totalPages++
	}
	return &model.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}
}

// CreateProductController - Tạo sản phẩm mới kèm danh mục
func (prt *productController) CreateProductController(product model.CreateProductRequest) (*model.AdminCreateProductResponse, error) {
	// 1. Check trùng tên
	existingByName, err := prt.Repo.GetConflictProductByName(product.Name)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if existingByName {
		return nil, fmt.Errorf("Product name already exists")
	}

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

	var publishedAt *time.Time
	if product.PublishedAt != "" {
		parsedTime, err := time.Parse(time.RFC3339, product.PublishedAt)
		if err != nil {
			return nil, err
		}
		publishedAt = &parsedTime
	}

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
		DiscountPercent:  product.DiscountPercent,
	}

	createdProduct, err := prt.Repo.CreateProduct(productToCreate, product.CategoryIDs)
	if err != nil {
		return nil, err
	}

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
			DiscountPercent:  createdProduct.DiscountPercent,
			FinalPrice:       calcFinalPrice(createdProduct.MinPrice, createdProduct.DiscountPercent),
			CreatedAt:        createdProduct.CreatedAt,
			UpdatedAt:        createdProduct.UpdatedAt,
			Categories:       createdProduct.Categories,
		},
	}, nil
}

// AdminImportProductsController - Xử lý mảng dữ liệu sản phẩm từ CSV
func (prt *productController) AdminImportProductsController(reqs []model.CreateProductRequest) (*model.AdminImportProductsResponse, error) {
	var errDetails []string
	var productsToInsert []*model.Product
	var categoryMappings [][]int64

	for i, req := range reqs {
		rowNum := i + 2 // Vì dòng 1 trêm CSV thường là header

		if req.Name == "" {
			errDetails = append(errDetails, fmt.Sprintf("Row %d: Name is required", rowNum))
			continue
		}
		if req.MinPrice <= 0 {
			errDetails = append(errDetails, fmt.Sprintf("Row %d: MinPrice must be > 0", rowNum))
			continue
		}

		if req.Slug == "" {
			req.Slug = slug.Make(req.Name)
		}

		existingName, _ := prt.Repo.GetProductByName(req.Name)
		if existingName != nil {
			errDetails = append(errDetails, fmt.Sprintf("Row %d: Product name '%s' already exists", rowNum, req.Name))
			continue
		}

		existingSlug, _ := prt.Repo.GetProductBySlug(req.Slug)
		if existingSlug != nil {
			errDetails = append(errDetails, fmt.Sprintf("Row %d: Product slug '%s' already exists", rowNum, req.Slug))
			continue
		}

		now := time.Now()
		var publishedAt *time.Time
		if req.IsPublished {
			publishedAt = &now
		}
		if req.Status == "" {
			req.Status = "active" // Default
		}

		productEntity := &model.Product{
			Name:             req.Name,
			Slug:             req.Slug,
			ShortDescription: stringToPtr(req.ShortDescription),
			Description:      stringToPtr(req.Description),
			Brand:            stringToPtr(req.Brand),
			Status:           req.Status,
			IsPublished:      req.IsPublished,
			PublishedAt:      publishedAt,
			MinPrice:         req.MinPrice,
			DiscountPercent:  req.DiscountPercent,
			AvgRating:        0,
			RatingCount:      0,
		}

		productsToInsert = append(productsToInsert, productEntity)
		categoryMappings = append(categoryMappings, req.CategoryIDs)
	}

	if len(errDetails) > 0 {
		return &model.AdminImportProductsResponse{
			Message:      "Import failed due to validation errors",
			TotalCreated: 0,
			Errors:       errDetails,
		}, nil
	}

	err := prt.Repo.BulkCreateProducts(productsToInsert, categoryMappings)
	if err != nil {
		return nil, fmt.Errorf("bulk insert failed: %w", err)
	}

	return &model.AdminImportProductsResponse{
		Message:      "Products imported successfully",
		TotalCreated: len(productsToInsert),
		Errors:       nil,
	}, nil
}

// getProductCommon - Lấy thông tin sản phẩm theo ID, Name hoặc Slug
func (prt *productController) getProductCommon(reqProduct *model.GetProductRequest) (*model.Product, error) {
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

	cats, err := prt.Repo.GetCategoriesByProductID(pro.ID)
	if err == nil {
		pro.Categories = cats
	}
	//lay rate va count reviews
	avgRating, err := prt.ReviewRepo.GetAverageRatingByProductID(pro.ID)
	if err == nil {
		pro.AvgRating = avgRating
	}

	if ratingCount, err := prt.ReviewRepo.GetCountRatingByProductID(pro.ID); err == nil {
		pro.RatingCount = int(ratingCount)
	}

	return pro, nil
}

// AdminGetProductController - Lấy chi tiết sản phẩm kèm variants cho Admin
func (prt *productController) AdminGetProductController(reqProduct *model.GetProductRequest) (*model.AdminProductDetailResponse, error) {

	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}

	variantsModel, err := prt.RepoVariants.GetProductVariantByID(pro.ID)
	if err != nil {
		variantsModel = []model.ProductsVariants{}
	}

	variantResponses := make([]model.AdminVariantResponse, 0, len(variantsModel))
	minPrice := pro.MinPrice
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

		if v.IsActive && v.PriceOverride != nil {
			if !hasActiveVariants || *v.PriceOverride < minPrice {
				minPrice = *v.PriceOverride
				hasActiveVariants = true
			}
		}
	}
	reviewsResponses, err := prt.ReviewRepo.GetProductReviewsByProductID(pro.ID)
	if err != nil {
		reviewsResponses = []model.ProductReview{}
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
			MinPrice:         minPrice,
			DiscountPercent:  pro.DiscountPercent,
			FinalPrice:       calcFinalPrice(minPrice, pro.DiscountPercent),
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
			Categories:       pro.Categories,
			Reviews:          reviewsResponses,
		},
		Variants: variantResponses,
	}, nil
}

// UserGetProductDetailController - Lấy chi tiết sản phẩm đã publish kèm variants active cho User
func (prt *productController) UserGetProductDetailController(reqProduct *model.GetProductRequest) (*model.UserProductDetailResponse, error) {

	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}

	if !pro.IsPublished {
		return nil, fmt.Errorf("product not available")
	}

	activeCategories := []model.Category{}
	if pro.Categories != nil {
		for _, cat := range pro.Categories {
			if cat.IsActive {
				activeCategories = append(activeCategories, cat)
			}
		}
	}
	pro.Categories = activeCategories

	variantsModel, err := prt.RepoVariants.GetProductVariantByID(pro.ID)
	if err != nil {
		variantsModel = []model.ProductsVariants{}
	}

	variantResponses := make([]model.UserVariantResponse, 0)
	minPrice := pro.MinPrice
	hasActiveVariants := false

	reviewReponse, err := prt.ReviewRepo.GetProductReviewsByProductID(pro.ID)
	for _, v := range variantsModel {
		if v.IsActive {
			resp := model.UserVariantResponse{
				StockQuantity: v.StockQuantity,
			}
			if v.Title != nil {
				resp.Title = *v.Title
			}
			if v.OptionValues != nil {
				resp.OptionValues = *v.OptionValues
			}

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
		MinPrice:         minPrice,
		DiscountPercent:  pro.DiscountPercent,
		FinalPrice:       calcFinalPrice(minPrice, pro.DiscountPercent),
		AvgRating:        pro.AvgRating,
		RatingCount:      pro.RatingCount,
		PublishedAt:      pro.PublishedAt,
		Categories:       pro.Categories,
		Variants:         variantResponses,
		Reviews:          reviewReponse,
	}, nil
}

// UpdateProductController - Cập nhật thông tin sản phẩm và danh mục
func (prt *productController) UpdateProductController(ctx context.Context, req model.UpdateProductRequest, id int64) (*model.AdminUpdateProductResponse, error) {
	existingProduct, err := prt.Repo.GetProductByID(id)
	if err != nil {
		return nil, fmt.Errorf("Product not found")
	}
	// Compare to check changed fields

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

	finalDiscountPercent := existingProduct.DiscountPercent
	if req.DiscountPercent != nil {
		finalDiscountPercent = *req.DiscountPercent
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
		DiscountPercent:  finalDiscountPercent,
		UpdatedAt:        time.Now(),
	}

	if productToUpdate.Status == "" {
		productToUpdate.Status = existingProduct.Status
	}

	updatedProduct, err := prt.Repo.UpdateProduct(productToUpdate, req.CategoryIDs)
	if err != nil {
		return nil, err
	}
	changes := make(map[string]model.ProductChangeLog)

	if existingProduct.Name != req.Name && req.Name != "" {
		changes["name"] = model.ProductChangeLog{
			Field:    "name",
			OldValue: existingProduct.Name,
			NewValue: req.Name,
		}
	}
	if existingProduct.Slug != req.Slug && req.Slug != "" {
		changes["slug"] = model.ProductChangeLog{
			Field:    "slug",
			OldValue: existingProduct.Slug,
			NewValue: req.Slug,
		}
	}
	if req.ShortDescription != "" &&
		(existingProduct.ShortDescription == nil || *existingProduct.ShortDescription != req.ShortDescription) {
		changes["short_description"] = model.ProductChangeLog{
			Field:    "short_description",
			OldValue: existingProduct.ShortDescription,
			NewValue: req.ShortDescription,
		}
	}
	if existingProduct.Description != stringToPtr(req.Description) && req.Description != "" {
		changes["description"] = model.ProductChangeLog{
			Field:    "description",
			OldValue: existingProduct.Description,
			NewValue: req.Description,
		}
	}
	if existingProduct.Brand != stringToPtr(req.Brand) && req.Brand != "" {
		changes["brand"] = model.ProductChangeLog{
			Field:    "brand",
			OldValue: existingProduct.Brand,
			NewValue: req.Brand,
		}
	}
	if existingProduct.Status != req.Status && req.Status != "" {
		changes["status"] = model.ProductChangeLog{
			Field:    "status",
			OldValue: existingProduct.Status,
			NewValue: req.Status,
		}
	}
	if req.IsPublished != nil && existingProduct.IsPublished != *req.IsPublished {
		changes["is_published"] = model.ProductChangeLog{
			Field:    "is_published",
			OldValue: existingProduct.IsPublished,
			NewValue: *req.IsPublished,
		}
	}
	if req.MinPrice != nil && existingProduct.MinPrice != *req.MinPrice {
		changes["min_price"] = model.ProductChangeLog{
			Field:    "min_price",
			OldValue: existingProduct.MinPrice,
			NewValue: *req.MinPrice,
		}
	}

	if req.PublishedAt != "" {
		newPublishedAt, err := time.Parse(time.RFC3339, req.PublishedAt)
		if err != nil {
			return nil, err
		}
		if existingProduct.PublishedAt == nil || !existingProduct.PublishedAt.Equal(newPublishedAt) {
			changes["published_at"] = model.ProductChangeLog{
				Field:    "published_at",
				OldValue: existingProduct.PublishedAt,
				NewValue: newPublishedAt,
			}
		}
	}

	if len(req.CategoryIDs) > 0 {
		var oldCategoryIDs []int64
		for _, cat := range existingProduct.Categories {
			oldCategoryIDs = append(oldCategoryIDs, cat.ID)
		}
		// Logic so sánh mảng đơn giản
		isDiff := false
		if len(oldCategoryIDs) != len(req.CategoryIDs) {
			isDiff = true
		} else {
			m := make(map[int64]bool)
			for _, x := range oldCategoryIDs {
				m[x] = true
			}
			for _, x := range req.CategoryIDs {
				if !m[x] {
					isDiff = true
					break
				}
			}
		}
		if isDiff {
			changes["categories"] = model.ProductChangeLog{Field: "categories", OldValue: oldCategoryIDs, NewValue: req.CategoryIDs}
		}
	}

	if len(changes) > 0 {
		changesBytes, err := json.Marshal(changes)
		if err == nil {

			// === 1. KHAI BÁO BIẾN ADMIN ID ===
			var adminID *int64 // Mặc định là nil

			// === 2. GỌI ADMIN ID TỪ CONTEXT (Dùng typed key từ middleware) ===
			if id, ok := middleware.GetUserIDFromContext(ctx); ok {
				adminID = &id
			}
			var note *string
			if req.Note != "" {
				note = &req.Note
			}
			// === 3. SỬ DỤNG ADMIN ID ===
			changeLog := &model.ProductHistory{
				ProductID: existingProduct.ID,
				AdminID:   adminID,
				Changes:   json.RawMessage(changesBytes),
				Note:      note,
				ChangedAt: time.Now(),
			}

			_, err = prt.HistoryRepo.CreateProductHistory(changeLog)

		}

	}
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
		DiscountPercent:  updatedProduct.DiscountPercent,
		FinalPrice:       calcFinalPrice(updatedProduct.MinPrice, updatedProduct.DiscountPercent),
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

// AdminGetAllProductsController - Lấy tất cả sản phẩm kèm danh mục cho Admin
func (prt *productController) AdminGetAllProductsController(req *model.SearchProductsRequest) (*model.AdminProductListResponse, error) {
	products, total, err := prt.Repo.GetAllProducts(req)
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
			DiscountPercent:  pro.DiscountPercent,
			FinalPrice:       calcFinalPrice(pro.MinPrice, pro.DiscountPercent),
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
		Message:    "Products retrieved successfully",
		Products:   responses,
		Pagination: buildPaginationMeta(req, total),
	}, nil
}

// UserGetAllProductsController - Lấy danh sách sản phẩm đã publish cho User
func (prt *productController) UserGetAllProductsController(req *model.SearchProductsRequest) (*model.UserProductListResponse, error) {
	products, total, err := prt.Repo.GetAllProducts(req)
	if err != nil {
		return nil, err
	}
	var responses []model.UserProductResponse
	for _, pro := range products {
		if !pro.IsPublished {
			continue
		}
		responses = append(responses, model.UserProductResponse{
			ID:              pro.ID,
			Name:            pro.Name,
			Brand:           pro.Brand,
			MinPrice:        pro.MinPrice,
			DiscountPercent: pro.DiscountPercent,
			FinalPrice:      calcFinalPrice(pro.MinPrice, pro.DiscountPercent),
		})
	}
	return &model.UserProductListResponse{
		Message:    "Products retrieved successfully",
		Products:   responses,
		Pagination: buildPaginationMeta(req, total),
	}, nil
}

// UserSearchProductByNameController - Tìm kiếm sản phẩm đã publish cho User
func (prt *productController) UserSearchProductByNameController(req *model.SearchProductsRequest) (*model.UserProductListResponse, error) {
	products, total, err := prt.Repo.SearchProducts(req)
	if err != nil {
		return nil, err
	}
	var res []model.UserProductResponse
	for _, pro := range products {
		if !pro.IsPublished {
			continue
		}
		res = append(res, model.UserProductResponse{
			ID:              pro.ID,
			Name:            pro.Name,
			Brand:           pro.Brand,
			MinPrice:        pro.MinPrice,
			DiscountPercent: pro.DiscountPercent,
			FinalPrice:      calcFinalPrice(pro.MinPrice, pro.DiscountPercent),
		})
	}
	return &model.UserProductListResponse{
		Message:    "Products retrieved successfully",
		Products:   res,
		Pagination: buildPaginationMeta(req, total),
	}, nil
}

// AdminSearchProductsController - Tìm kiếm sản phẩm cho Admin
func (prt *productController) AdminSearchProductsController(req *model.SearchProductsRequest) (*model.AdminProductListResponse, error) {
	products, total, err := prt.Repo.SearchProducts(req)
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
			DiscountPercent:  pro.DiscountPercent,
			FinalPrice:       calcFinalPrice(pro.MinPrice, pro.DiscountPercent),
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
		Message:    "Products retrieved successfully",
		Products:   adminProducts,
		Pagination: buildPaginationMeta(req, total),
	}, nil
}

// AdminGetManyProductByIDController - Lấy nhiều sản phẩm theo danh sách IDs
func (prt *productController) AdminGetManyProductByIDController(ids []int64) ([]model.AdminProductResponse, error) {
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
			DiscountPercent:  pro.DiscountPercent,
			FinalPrice:       calcFinalPrice(pro.MinPrice, pro.DiscountPercent),
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
			Categories:       pro.Categories,
			Variants:         pro.Variants,
		})
	}
	return responses, nil
}

// UserGetProductController - Lấy thông tin rút gọn sản phẩm đã publish cho User
func (prt *productController) UserGetProductController(reqProduct *model.GetProductRequest) (*model.UserProductResponse, error) {
	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}
	if !pro.IsPublished {
		return nil, fmt.Errorf("product not available")
	}
	return &model.UserProductResponse{
		ID:              pro.ID,
		Name:            pro.Name,
		Brand:           pro.Brand,
		MinPrice:        pro.MinPrice,
		DiscountPercent: pro.DiscountPercent,
		FinalPrice:      calcFinalPrice(pro.MinPrice, pro.DiscountPercent),
	}, nil
}

// AdminDeleteSoftProductController - Xóa mềm sản phẩm
func (prt *productController) AdminDeleteSoftProductController(id int64) error {
	return prt.Repo.DeleteSoftProduct(id)
}

// AdminGetAllSoftDeletedProductsController - Lấy danh sách sản phẩm đã xóa mềm
func (prt *productController) AdminGetAllSoftDeletedProductsController() (*model.AdminProductListResponse, error) {
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
			DiscountPercent:  pro.DiscountPercent,
			FinalPrice:       calcFinalPrice(pro.MinPrice, pro.DiscountPercent),
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

// AdminDeleteAllSoftDeletedProductsController -
func (prt *productController) AdminDeleteAllSoftDeletedProductsController() error {
	return prt.Repo.DeleteAllProductsSoftDeleted()
}

// AdminDeleteAllProductsController - Xóa cứng tất cả sản phẩm
func (prt *productController) AdminDeleteAllProductsController() error {
	return prt.Repo.DeleteAllProducts()
}
