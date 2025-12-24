package producthistory

import (
	"golang/internal/model"
	"golang/internal/repository/producthistory"
	"math"
)

type productHistoryController struct {
	HistoryRepo producthistory.ProductHistoryRepository
}

func NewProductHistoryController(repo producthistory.ProductHistoryRepository) ProductHistoryController {
	return &productHistoryController{
		HistoryRepo: repo,
	}
}

func (ph *productHistoryController) GetProductHistoryByProductIDController(productID []int64) ([]model.GetProductHistoryResponse, error) {
	histories, err := ph.HistoryRepo.GetProductHistoryByProductID(productID)
	if err != nil {
		return nil, err
	}
	var res []model.GetProductHistoryResponse
	for _, h := range histories {
		historyResp := model.GetProductHistoryResponse{
			Message: "PRODUCT INFORMATION CHANGED",
			Histories: []model.ProductHistoryResponse{
				{
					ID:        h.ID,
					ProductID: h.ProductID,
					VariantID: h.VariantID,
					AdminID:   h.AdminID,
					ChangedAt: h.ChangedAt,
					Changes:   h.Changes,
					Note:      h.Note,
				},
			},
		}
		res = append(res, historyResp)
	}
	return res, nil
}

func (ph *productHistoryController) GetAllProductsHistory(page, limit int) (*model.GetAllProductsHistoryReponse, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit

	histories, err := ph.HistoryRepo.GetAllProductsHistory(limit, offset)
	if err != nil {
		return nil, err
	}
	count, err := ph.HistoryRepo.CountProductsHistory()
	if err != nil {
		return nil, err
	}
	totalPages := int(math.Ceil(float64(count) / float64(limit)))
	var res []model.ProductHistoryResponse
	for _, h := range histories {
		historyResp := model.ProductHistoryResponse{
			ID:        h.ID,
			ProductID: h.ProductID,
			VariantID: h.VariantID,
			AdminID:   h.AdminID,
			ChangedAt: h.ChangedAt,
			Changes:   h.Changes,
			Note:      h.Note,
		}
		res = append(res, historyResp)
	}
	return &model.GetAllProductsHistoryReponse{
		Message: "All product histories retrieved successfully",
		Meta: model.PagniationMeta{
			CurrentPage: page,
			TotalPages:  totalPages,
			Page:        page,
			Limit:       limit,
		},
		Histories: res,
	}, nil

}
