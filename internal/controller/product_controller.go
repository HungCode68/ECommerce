package controller

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	"golang/internal/repository"
	"time"
)

type ProductController struct {
	Repo repository.ProductResponsitory
}

func NewProductController(repo repository.ProductResponsitory) *ProductController {
	return &ProductController{Repo: repo}
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
		ShortDescription: product.ShortDescription,
		Description:      product.Description,
		Brand:            product.Brand,
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

// getbid

func (prt *ProductController) AdminGetProductController(reqProduct *model.GetProductRequest) (*model.AdminProductDetailResponse, error) {

	if reqProduct.ID == 0 && reqProduct.Name == "" && reqProduct.Slug == "" {
		return nil, fmt.Errorf("Data not entered")
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
		return nil, fmt.Errorf("Database query failed: %v", err)
	}

	resp := &model.AdminProductDetailResponse{
		Message: "Get product successfully",
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
			MinPrice:         pro.MinPrice,
			AvgRating:        pro.AvgRating,
			RatingCount:      pro.RatingCount,
			CreatedBy:        pro.CreatedBy,
			UpdatedBy:        pro.UpdatedBy,
			CreatedAt:        pro.CreatedAt,
			UpdatedAt:        pro.UpdatedAt,
			DeletedAt:        pro.DeletedAt,
		},
	}

	return resp, nil
}

func (prt *ProductController) UserGetProductDetailController(reqProduct *model.GetProductRequest) (*model.UserProductDetailResponse, error) {
	if reqProduct.ID == 0 && reqProduct.Name == "" && reqProduct.Slug == "" {
		return nil, fmt.Errorf("Data not entered")
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
		return nil, fmt.Errorf("Data query failed %v", err)
	}

	resp := &model.UserProductDetailResponse{
		Message:          "Get product successfully",
		ID:               pro.ID,
		Name:             pro.Name,
		ShortDescription: pro.ShortDescription,
		Description:      pro.Description,
		Brand:            pro.Brand,
		MinPrice:         pro.MinPrice,
		AvgRating:        pro.AvgRating,
		RatingCount:      pro.RatingCount,
		PublishedAt:      pro.PublishedAt,
	}
	return resp, nil

}

func (prt *ProductController) UserGetProductController(reqProduct *model.GetProductRequest) (*model.UserProductResponse,error){
	if reqProduct.ID == 0 && reqProduct.Name == "" && reqProduct.Slug == "" {
		return nil, fmt.Errorf("Data not entered")
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
		return nil, fmt.Errorf("Data query failed %v", err)
	}

	resp := &model.UserProductResponse{
		Message:          "Get product successfully",
		ID:               pro.ID,
		Name:             pro.Name,	
		Brand:            pro.Brand,
		MinPrice:         pro.MinPrice,
	}
	return resp, nil
}

func (prt *ProductController) AdminGetManyProductController(ids []int64)([]model.AdminProductResponse,error){
	products, err := prt.Repo.GetManyProduct(ids)
	if err != nil {
		return nil,err
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
	return responses,nil
}