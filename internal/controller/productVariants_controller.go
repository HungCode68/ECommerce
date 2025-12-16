package controller

import (
	"golang/internal/model"
	"golang/internal/repository"
)

type ProductVariantController struct {
	VariantRepo repository.ProductVariantsRepository
}

func NewProductVariantController(repoVariant repository.ProductVariantsRepository) *ProductVariantController {
	return &ProductVariantController{VariantRepo: repoVariant}
}

func (c *ProductVariantController) CreateVariant(req model.CreateVariantRequest, productID int64) (*model.CreateVariantResponse, error) {
	newVariant := &model.ProductsVariants{
		ProductID:      productID,
		SKU:            req.SKU,
		Title:          &req.Title,
		OptionValues:   &req.OptionValues,
		PriceOverride:  &req.PriceOverride,
		CostPrice:      &req.CostPrice,
		StockQuantity:  req.StockQuantity,
		IsActive:       req.IsActive,
		AllowBackorder: req.AllowBackorder,
	}
	createVariant, err := c.VariantRepo.CreateProductVariant(newVariant)
	if err != nil {
		return nil, err
	}
	reponseVariant := &model.CreateVariantResponse{
		Message: "Create successfully",
		ProVariant: model.AdminVariantReponse{
			ID:             createVariant.ID,
			ProductID:      createVariant.ProductID,
			SKU:            createVariant.SKU,
			Title:          createVariant.Title,
			OptionValues:   createVariant.OptionValues,
			PriceOverride:  createVariant.PriceOverride,
			CostPrice:      createVariant.CostPrice,
			StockQuantity:  createVariant.StockQuantity,
			IsActive:       createVariant.IsActive,
			AllowBackorder: createVariant.AllowBackorder,
			CreatedAt:      createVariant.CreatedAt.String(),
		},
	}
	return reponseVariant, nil
}

// Xử lý costprice vẫn null và stockquantity
