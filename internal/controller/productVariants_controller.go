package controller

import (
	"fmt"
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
		ProVariant: model.AdminVariantResponse{
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

func (c *ProductVariantController) UpdateVariant(req model.UpdateVariantRequest, variantID int64, productID int64) (*model.UpdateVariantResponse, error) {
	// Kiểm tra variant có tồn tại không
	existingVariant, err := c.VariantRepo.GetVariantByID(variantID)
	if err != nil {
		return nil, err
	}

	// Kiểm tra variant có thuộc product này không
	if existingVariant.ProductID != productID {
		return nil, fmt.Errorf("Variant does not belong to this product")
	}

	// Update variant
	updatedVariant := &model.ProductsVariants{
		ID:             variantID,
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

	err = c.VariantRepo.UpdateProductVariant(updatedVariant)
	if err != nil {
		return nil, err
	}

	// Lấy lại variant sau khi update
	updatedData, err := c.VariantRepo.GetVariantByID(variantID)
	if err != nil {
		return nil, err
	}

	return &model.UpdateVariantResponse{
		Message: "Variant updated successfully",
		ProVariant: model.AdminVariantResponse{
			ID:             updatedData.ID,
			ProductID:      updatedData.ProductID,
			SKU:            updatedData.SKU,
			Title:          updatedData.Title,
			OptionValues:   updatedData.OptionValues,
			PriceOverride:  updatedData.PriceOverride,
			CostPrice:      updatedData.CostPrice,
			StockQuantity:  updatedData.StockQuantity,
			IsActive:       updatedData.IsActive,
			AllowBackorder: updatedData.AllowBackorder,
			CreatedAt:      updatedData.CreatedAt.String(),
		},
	}, nil
}

func (c *ProductVariantController) DeleteVariant(variantID int64, productID int64) (*model.DeleteVariantResponse, error) {
	// Kiểm tra variant có tồn tại không
	existingVariant, err := c.VariantRepo.GetVariantByID(variantID)
	if err != nil {
		return nil, err
	}

	// Kiểm tra variant có thuộc product này không
	if existingVariant.ProductID != productID {
		return nil, fmt.Errorf("Variant does not belong to this product")
	}

	// Xóa variant
	err = c.VariantRepo.DeleteProductVariant(variantID)
	if err != nil {
		return nil, err
	}

	return &model.DeleteVariantResponse{
		Message: "Variant deleted successfully",
	}, nil
}

