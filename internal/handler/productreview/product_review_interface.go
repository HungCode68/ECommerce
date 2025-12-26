package productreview

import "net/http"

type ProductReviewHandler interface {
	CreateReviewHandler(w http.ResponseWriter, r *http.Request)
	ListReviewsHandler(w http.ResponseWriter, r *http.Request)
	DeleteReviewHandler(w http.ResponseWriter, r *http.Request)
}
