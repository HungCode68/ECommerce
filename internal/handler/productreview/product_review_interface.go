package productreview

import "net/http"

type ProductReviewHandler interface {
	CreateReviewHandler(w http.ResponseWriter, r *http.Request)
	ListReviewsHandler(w http.ResponseWriter, r *http.Request)
	DeleteReviewHandler(w http.ResponseWriter, r *http.Request)
	UploadReviewImageHandler(w http.ResponseWriter, r *http.Request)
	GetUserReviewByOrderHandler(w http.ResponseWriter, r *http.Request)
	EditUserReviewHandler(w http.ResponseWriter, r *http.Request)
	AdminDeleteReviewHandler(w http.ResponseWriter, r *http.Request)
	AdminReplyToReviewHandler(w http.ResponseWriter, r *http.Request)
	GetAllReviewsAdminHandler(w http.ResponseWriter, r *http.Request)
}
