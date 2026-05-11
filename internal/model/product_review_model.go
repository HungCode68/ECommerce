package model

type ProductReview struct {
	ID                int64   `json:"id"`
	ProductID         int64   `json:"product_id"`
	Body              *string `json:"body"`
	Rating            int     `json:"rating"`
	PerformanceRating int     `json:"performance_rating"`
	BatteryRating     int     `json:"battery_rating"`
	CameraRating      int     `json:"camera_rating"`
	ImageURLs         []string `json:"image_urls,omitempty"`
	UserID            int64   `json:"user_id"`
	UserName          string  `json:"user_name,omitempty"`
	VerifiedPurchase  bool    `json:"verified_purchase"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

// Request create product review
type CreateProductReviewRequest struct {
	Body              *string `json:"body" binding:"required" validate:"min=15,max=1000,badwords"`
	Rating            int     `json:"rating" binding:"required" validate:"min=1,max=5"`
	PerformanceRating int     `json:"performance_rating" binding:"required" validate:"min=1,max=5"`
	BatteryRating     int     `json:"battery_rating" binding:"required" validate:"min=1,max=5"`
	CameraRating      int     `json:"camera_rating" binding:"required" validate:"min=1,max=5"`
	ImageURLs         []string `json:"image_urls,omitempty"`
}

// Response product review
type ProductReviewResponse struct {
	ID                int64   `json:"id"`
	ProductID         int64   `json:"product_id"`
	Body              *string `json:"body"`
	Rating            int     `json:"rating"`
	PerformanceRating int     `json:"performance_rating"`
	BatteryRating     int     `json:"battery_rating"`
	CameraRating      int     `json:"camera_rating"`
	ImageURLs         []string `json:"image_urls,omitempty"`
	UserID            int64   `json:"user_id"`
	UserName          string  `json:"user_name,omitempty"`
	VerifiedPurchase  bool    `json:"verified_purchase"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

type RatingBreakdownItem struct {
	Rating int   `json:"rating"`
	Count  int64 `json:"count"`
}

// Response for creating a review
type CreateProductReviewResponse struct {
	Message string                `json:"message"`
	Review  ProductReviewResponse `json:"review"`
}

// Response for listing reviews
type ProductReviewListResponse struct {
	Message            string                `json:"message"`
	ProductID          int64                 `json:"product_id"`
	AvgRating          float64               `json:"avg_rating"`
	RatingCount        int64                 `json:"rating_count"`
	PerformanceAvg     float64               `json:"performance_avg"`
	BatteryAvg         float64               `json:"battery_avg"`
	CameraAvg          float64               `json:"camera_avg"`
	RatingBreakdown    []RatingBreakdownItem `json:"rating_breakdown"`
	Reviews            []ProductReviewResponse `json:"reviews"`
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
