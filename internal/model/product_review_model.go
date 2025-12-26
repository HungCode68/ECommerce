package model

type ProductReview struct {
	ID        int64   `json:"id"`
	ProductID int64   `json:"product_id"`
	Body      *string `json:"body"`
	Rating    int     `json:"rating"`
	UserID    int64   `json:"user_id"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

// Request create product review
type CreateProductReviewRequest struct {
	Body   *string `json:"body" binding:"required"  validate:"min=5,max=1000,badwords"`
	Rating int     `json:"rating" binding:"required" validate:"min=1,max=5"`
}

// Response product review
type ProductReviewResponse struct {
	ID        int64   `json:"id"`
	ProductID int64   `json:"product_id"`
	Body      *string `json:"body"`
	Rating    int     `json:"rating"`
	UserID    int64   `json:"user_id"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

// Response for creating a review
type CreateProductReviewResponse struct {
	Message string                `json:"message"`
	Review  ProductReviewResponse `json:"review"`
}

// Response for listing reviews
type ProductReviewListResponse struct {
	Message     string                  `json:"message"`
	ProductID   int64                   `json:"product_id"`
	AvgRating   float64                 `json:"avg_rating"`
	RatingCount int64                   `json:"rating_count"`
	Reviews     []ProductReviewResponse `json:"reviews"`
}

// Response for deleting a review
type DeleteProductReviewResponse struct {
	Message string `json:"message"`
}

type UserProductReviewResponse struct {
	Body *string `json:"body"`
}
type AdminProductReviewResponse struct {
	ID        int64   `json:"id"`
	UserID    int64   `json:"user_id"`
	Body      *string `json:"body"`
	Rating    int     `json:"rating"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}
