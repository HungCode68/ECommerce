package controller

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	"golang/internal/repository"
	"time"
)

type ProductController struct {
	Repo         repository.ProductResponsitory
	RepoVariants repository.ProductVariantsRepository
}

func NewProductController(repo repository.ProductResponsitory, repoVariants repository.ProductVariantsRepository) *ProductController {
	return &ProductController{
		Repo:         repo,
		RepoVariants: repoVariants,
	}
}

// =================================================================
// HELPER FUNCTIONS
// =================================================================

// stringToPtr converts string to *string, returns nil if empty
func stringToPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// Create

func (prt *ProductController) CreateProductController(product model.CreateProductRequest) (*model.AdminCreateProductResponse, error) {
	existingByName, err := prt.Repo.GetConflictProductByName(product.Name)
	if err != nil && err != sql.ErrNoRows {
		return nil, err //failed database
	}
	if existingByName {
		return nil, fmt.Errorf("Product name already exists")
	}
	existingBySlug, err := prt.Repo.GetConflictProductBySlug(product.Slug)
	if err != nil && err != sql.ErrNoRows {
		return nil, err //failed database
	}
	if existingBySlug {
		return nil, fmt.Errorf("Product slug already exists")
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
		Slug:             product.Slug,
		ShortDescription: &(product.ShortDescription),
		Description:      &(product.Description),
		Brand:            &(product.Brand),
		Status:           product.Status,
		IsPublished:      product.IsPublished,
		PublishedAt:      publishedAt,
		MinPrice:         product.MinPrice,
	}
	createdProduct, err := prt.Repo.CreateProduct(productToCreate)
	if err != nil {
		return nil, err
	}
	reponse := &model.AdminCreateProductResponse{
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
		},
	}
	return reponse, nil
}

// =================================================================
// PRIVATE HELPER - Tìm kiếm sản phẩm (tránh duplicate code)
// =================================================================

// getProductCommon - Hàm private để tìm sản phẩm theo ID/Name/Slug
func (prt *ProductController) getProductCommon(reqProduct *model.GetProductRequest) (*model.Product, error) {
	// Validate input
	if reqProduct.ID == 0 && reqProduct.Name == "" && reqProduct.Slug == "" {
		return nil, fmt.Errorf("at least one search parameter (id, name, or slug) is required")
	}

	var (
		pro *model.Product
		err error
	)

	// Tìm theo thứ tự ưu tiên: ID > Slug > Name
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

	return pro, nil
}

// =================================================================
// ADMIN CONTROLLERS
// =================================================================

// AdminGetProductController - Lấy chi tiết sản phẩm (Admin)
func (prt *ProductController) AdminGetProductController(reqProduct *model.GetProductRequest) (*model.AdminProductDetailResponse, error) {
	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}

	// Lấy variants
	variantsModel, err := prt.RepoVariants.GetProductVariantByID(pro.ID)
	if err != nil {
		variantsModel = []model.ProductsVariants{} // Nếu lỗi thì trả về mảng rỗng
	}

	// Convert variants sang AdminVariantResponse
	variantResponses := make([]model.AdminVariantResponse, 0, len(variantsModel))
	minPrice := pro.MinPrice // Giá mặc định từ product
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

		// Tính min_price từ variants active
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
			MinPrice:         minPrice, // Sử dụng min_price đã tính toán
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
		},
		Variants: variantResponses,
	}, nil
}

// =================================================================
// USER CONTROLLERS
// =================================================================

// UserGetProductDetailController - Lấy chi tiết sản phẩm (User)
func (prt *ProductController) UserGetProductDetailController(reqProduct *model.GetProductRequest) (*model.UserProductDetailResponse, error) {
	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}

	// Chỉ trả về sản phẩm đã published
	if !pro.IsPublished {
		return nil, fmt.Errorf("product not available")
	}

	// Lấy variants
	variantsModel, err := prt.RepoVariants.GetProductVariantByID(pro.ID)
	if err != nil {
		variantsModel = []model.ProductsVariants{} // Nếu lỗi thì trả về mảng rỗng
	}

	// Convert variants sang UserVariantResponse (chỉ lấy variants active)
	variantResponses := make([]model.UserVariantResponse, 0)
	minPrice := pro.MinPrice // Giá mặc định từ product
	hasActiveVariants := false

	for _, v := range variantsModel {
		// Chỉ hiển thị variant đang active
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
			// Logic hiển thị giá: Nếu không có giá đè thì lấy giá gốc
			if v.PriceOverride != nil {
				resp.Price = *v.PriceOverride
				// Tính min_price từ variants
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
		MinPrice:         minPrice, // Sử dụng min_price đã tính toán
		AvgRating:        pro.AvgRating,
		RatingCount:      pro.RatingCount,
		PublishedAt:      pro.PublishedAt,
		Variants:         variantResponses,
	}, nil
}

// UserGetProductController - Lấy thông tin cơ bản sản phẩm (User)
func (prt *ProductController) UserGetProductController(reqProduct *model.GetProductRequest) (*model.UserProductResponse, error) {
	pro, err := prt.getProductCommon(reqProduct)
	if err != nil {
		return nil, err
	}

	// Chỉ trả về sản phẩm đã published
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

func (prt *ProductController) AdminGetManyProductByIDController(ids []int64) ([]model.AdminProductResponse, error) {
	products, err := prt.Repo.GetManyProduct(ids)
	if err != nil {
		return nil, err
	}
	var responses []model.AdminProductResponse
	for _, pro := range products {
		resp := model.AdminProductResponse{
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
		}
		responses = append(responses, resp)
	}
	return responses, nil
}

func (prt *ProductController) UserSearchProductByNameController(req *model.SearchProductsRequest) (*model.UserProductListResponse, error) {

	products, err := prt.Repo.SearchProducts(req)
	if err != nil {
		return nil, err
	}
	var res []model.UserProductResponse

	for _, pro := range products {
		if pro.IsPublished == false {
			continue
		}
		resp := model.UserProductResponse{
			ID:       pro.ID,
			Name:     pro.Name,
			Brand:    pro.Brand,
			MinPrice: pro.MinPrice,
		}
		res = append(res, resp)
	}
	return &model.UserProductListResponse{
		Message:  "Products retrieved successfully",
		Products: res,
	}, nil
}

// AdminSearchProductsController - Tìm kiếm sản phẩm cho Admin
func (prt *ProductController) AdminSearchProductsController(req *model.SearchProductsRequest) (*model.AdminProductListResponse, error) {
	products, err := prt.Repo.SearchProducts(req)
	if err != nil {
		return nil, fmt.Errorf("failed to search products: %w", err)
	}

	// Convert sang AdminProductResponse
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
		})
	}

	return &model.AdminProductListResponse{
		Message:  "Products retrieved successfully",
		Products: adminProducts,
	}, nil
}
func (prt *ProductController) UpdateProductController(product model.UpdateProductRequest, id int64) (*model.AdminUpdateProductResponse, error) {
	_, err := prt.Repo.GetProductByID(id)
	if err != nil {
		return nil, fmt.Errorf("Product not found")
	}
	existingByName, err := prt.Repo.GetConflictProductByName(product.Name)
	if err != nil && err != sql.ErrNoRows {
		return nil, err //failed database
	}
	if existingByName {
		return nil, fmt.Errorf("Product name already exists")
	}
	existingBySlug, err := prt.Repo.GetConflictProductBySlug(product.Slug)
	if err != nil && err != sql.ErrNoRows {
		return nil, err //failed database
	}
	if existingBySlug {
		return nil, fmt.Errorf("Product slug already exists")
	}

	var publishedAt *time.Time
	if product.PublishedAt != "" {
		parsedTime, err := time.Parse(time.RFC3339, product.PublishedAt)
		if err != nil {
			return nil, err
		}
		publishedAt = &parsedTime
	}
	productToUpdate := &model.Product{
		ID:               id,
		Name:             product.Name,
		Slug:             product.Slug,
		ShortDescription: stringToPtr(product.ShortDescription),
		Description:      stringToPtr(product.Description),
		Brand:            stringToPtr(product.Brand),
		Status:           product.Status,
		IsPublished:      *product.IsPublished,
		PublishedAt:      publishedAt,
		MinPrice:         *product.MinPrice,
		UpdatedAt:        time.Now(),
	}
	updatedProduct, err := prt.Repo.UpdateProduct(productToUpdate)
	if err != nil {
		return nil, err
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
		CreatedAt:        updatedProduct.CreatedAt,
		UpdatedAt:        updatedProduct.UpdatedAt,
	}
	return &model.AdminUpdateProductResponse{
		Message: "Product updated successfully",
		Product: *reponse,
	}, nil
}
func (prt *ProductController) AdminGetAllProductsController() (*model.AdminProductListResponse, error) {
	products, err := prt.Repo.GetAllProducts()
	if err != nil {
		return nil, err
	}
	var responses []model.AdminProductResponse
	for _, pro := range products {
		resp := model.AdminProductResponse{
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
		}
		responses = append(responses, resp)
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
		if pro.IsPublished == false {
			continue
		}
		resp := model.UserProductResponse{
			ID:       pro.ID,
			Name:     pro.Name,
			Brand:    pro.Brand,
			MinPrice: pro.MinPrice,
		}
		responses = append(responses, resp)
	}
	return &model.UserProductListResponse{
		Message:  "Products retrieved successfully",
		Products: responses,
	}, nil
}
func (prt *ProductController) AdminDeleteSoftProductController(id int64) error {
	err := prt.Repo.DeleteSoftProduct(id)
	if err != nil {
		return err
	}
	return nil
}

func (prt *ProductController) AdminGetAllSoftDeletedProductsController() (*model.AdminProductListResponse, error) {
	products, err := prt.Repo.GetAllProductsSoftDeleted()
	if err != nil {
		return nil, err
	}
	var responses []model.AdminProductResponse
	for _, pro := range products {
		resp := model.AdminProductResponse{
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
		}
		responses = append(responses, resp)
	}
	return &model.AdminProductListResponse{
		Message:  "Soft deleted products retrieved successfully",
		Products: responses,
	}, nil
}
func (prt *ProductController) AdminDeleteAllSoftDeletedProductsController() error {
	err := prt.Repo.DeleteAllProductsSoftDeleted()
	if err != nil {
		return err
	}
	return nil
}
func (prt *ProductController) AdminDeleteAllProductsController() error {
	err := prt.Repo.DeleteAllProducts()
	if err != nil {
		return err
	}
	return nil
}
