package producthistory

import "golang/internal/model"

type ProductHistoryRepository interface {
	CreateProductHistory(history *model.ProductHistory) (*model.ProductHistory, error)
	GetProductHistoryByProductID(productID []int64) ([]model.ProductHistory, error)
	GetAllProductsHistory(limit, offset int) ([]model.ProductHistory, error)
	CountProductsHistory() (int, error)
}

