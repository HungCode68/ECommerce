package productreviews

import (
	"golang/internal/model"
	"golang/internal/repository/productreview"
)

type productReviewsController struct {
	reviewRepo productreview.ProductReviewRepository
}

// NewProductReviewsController wires repository into controller layer.
func NewProductReviewsController(repo productreview.ProductReviewRepository) ProductReviewsController {
	return &productReviewsController{reviewRepo: repo}
}

func (c *productReviewsController) CreateReview(req model.CreateProductReviewRequest, productID int64, userID int64) (*model.CreateProductReviewResponse, error) {
	toCreate := &model.ProductReview{
		ProductID: productID,
		Body:      req.Body,
		Rating:    req.Rating,
		UserID:    userID,
	}

	created, err := c.reviewRepo.CreateProductReview(toCreate)
	if err != nil {
		return nil, err
	}

	resp := model.ProductReviewResponse{
		ID:        created.ID,
		ProductID: created.ProductID,
		Body:      created.Body,
		Rating:    created.Rating,
		UserID:    created.UserID,
		CreatedAt: created.CreatedAt,
		UpdatedAt: created.UpdatedAt,
	}

	return &model.CreateProductReviewResponse{
		Message: "Review created successfully",
		Review:  resp,
	}, nil
}

func (c *productReviewsController) ListReviews(productID int64) (*model.ProductReviewListResponse, error) {
	reviews, err := c.reviewRepo.GetProductReviewsByProductID(productID)
	if err != nil {
		return nil, err
	}

	avg, err := c.reviewRepo.GetAverageRatingByProductID(productID)
	if err != nil {
		return nil, err
	}

	count, err := c.reviewRepo.GetCountRatingByProductID(productID)
	if err != nil {
		return nil, err
	}

	respReviews := make([]model.ProductReviewResponse, 0, len(reviews))
	for _, r := range reviews {
		respReviews = append(respReviews, model.ProductReviewResponse{
			ID:        r.ID,
			ProductID: r.ProductID,
			Body:      r.Body,
			Rating:    r.Rating,
			UserID:    r.UserID,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
		})
	}

	return &model.ProductReviewListResponse{
		Message:     "Reviews fetched successfully",
		ProductID:   productID,
		AvgRating:   avg,
		RatingCount: count,
		Reviews:     respReviews,
	}, nil
}

func (c *productReviewsController) DeleteReview(reviewID int64) (*model.DeleteProductReviewResponse, error) {
	if err := c.reviewRepo.DeleteReviewByID(reviewID); err != nil {
		return nil, err
	}
	return &model.DeleteProductReviewResponse{Message: "Review deleted successfully"}, nil
}
