package producthistory

import "net/http"

type ProductHistoryHandler interface {
	GetProductHistoryByProductIDHandler(w http.ResponseWriter, r *http.Request)
	GetAllProductsHistoryHandler(w http.ResponseWriter, r *http.Request)
}
