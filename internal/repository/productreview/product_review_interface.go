package productreview

import "golang/internal/model"

type ProductReviewRepository interface {
	CreateProductReview(review *model.ProductReview) (*model.ProductReview, error)
	GetProductReviewsByProductID(productID int64) ([]model.ProductReview, error)
	GetAverageRatingByProductID(productID int64) (float64, error)
	GetCountRatingByProductID(productID int64) (int64, error)
	DeleteReviewByID(reviewID int64) error
}
