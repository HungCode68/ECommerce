package producthistory

import "golang/internal/model"

type ProductHistoryController interface {
	GetProductHistoryByProductIDController(productID []int64) ([]model.GetProductHistoryResponse, error)
	GetAllProductsHistory(page,limit int) (*model.GetAllProductsHistoryReponse, error)
}
