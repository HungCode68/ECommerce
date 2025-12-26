package productreviews

import "golang/internal/model"

type ProductReviewsController interface {
	CreateReview(req model.CreateProductReviewRequest, productID int64, userID int64) (*model.CreateProductReviewResponse, error)
	ListReviews(productID int64) (*model.ProductReviewListResponse, error)
	DeleteReview(reviewID int64) (*model.DeleteProductReviewResponse, error)
}
