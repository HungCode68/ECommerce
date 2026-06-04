package productreview

import "golang/internal/model"

type ProductReviewRepository interface {
	CreateProductReview(review *model.ProductReview) (*model.ProductReview, error)
	GetProductReviewsByProductID(productID int64) ([]model.ProductReview, error)
	GetAverageRatingByProductID(productID int64) (float64, error)
	GetCountRatingByProductID(productID int64) (int64, error)
	DeleteReviewByID(reviewID int64) error
	HasOrderReviewedProduct(orderID int64, productID int64) (bool, error)
	UpdateProductRating(productID int64, avgRating float64, count int64) error
	GetReviewByID(reviewID int64) (*model.ProductReview, error)
	GetReviewByOrderAndProduct(orderID int64, productID int64, userID int64) (*model.ProductReview, error)
	UpdateReview(review *model.ProductReview) error
	UpdateSellerReply(reviewID int64, reply *string) error
	GetAllReviews(offset int, limit int) ([]model.ProductReview, int64, error)
	AdminSoftDeleteReview(reviewID int64, reason string) error
}
