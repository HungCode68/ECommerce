package productreviews

import (
	"context"
	"golang/internal/model"
)

type ProductReviewsController interface {
	CreateReview(ctx context.Context, req model.CreateProductReviewRequest, productID int64, userID int64) (*model.CreateProductReviewResponse, error)
	ListReviews(productID int64) (*model.ProductReviewListResponse, error)
	DeleteReview(ctx context.Context, reviewID int64, userID int64) (*model.DeleteProductReviewResponse, error)
	GetUserReviewByOrder(ctx context.Context, orderID int64, productID int64, userID int64) (*model.ProductReviewResponse, error)
	EditUserReview(ctx context.Context, reviewID int64, req model.UpdateProductReviewRequest, userID int64) (*model.ProductReviewResponse, error)
	AdminReplyToReview(ctx context.Context, reviewID int64, req model.AdminReplyReviewRequest) error
	GetAllReviews(offset int, limit int) ([]model.ProductReviewResponse, int64, error)
	AdminDeleteReview(ctx context.Context, reviewID int64, reason string) error
}
