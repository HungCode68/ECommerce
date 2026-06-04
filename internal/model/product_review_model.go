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
	OrderID           *int64  `json:"order_id,omitempty"`
	IsEdited          bool    `json:"is_edited"`
	SellerReply       *string `json:"seller_reply,omitempty"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
	DeletedAt         *string `json:"deleted_at,omitempty"`
	DeletedReason     *string `json:"deleted_reason,omitempty"`
}

// Request create product review
type CreateProductReviewRequest struct {
	OrderID           int64   `json:"order_id" binding:"required" validate:"required,gt=0"`
	Body              *string `json:"body" binding:"omitempty" validate:"omitempty,min=15,max=1000,badwords"`
	Rating            int     `json:"rating" binding:"required" validate:"min=1,max=5"`
	PerformanceRating int     `json:"performance_rating" binding:"required" validate:"min=1,max=5"`
	BatteryRating     int     `json:"battery_rating" binding:"required" validate:"min=1,max=5"`
	CameraRating      int     `json:"camera_rating" binding:"required" validate:"min=1,max=5"`
	ImageURLs         []string `json:"image_urls,omitempty"`
}

type UpdateProductReviewRequest struct {
	Rating            int      `json:"rating" binding:"required,min=1,max=5"`
	Body              *string  `json:"body" binding:"omitempty" validate:"omitempty,min=15,max=1000,badwords"`
	PerformanceRating int      `json:"performance_rating" binding:"required,min=1,max=5"`
	BatteryRating     int      `json:"battery_rating" binding:"required,min=1,max=5"`
	CameraRating      int      `json:"camera_rating" binding:"required,min=1,max=5"`
	ImageURLs         []string `json:"image_urls,omitempty"`
}

type AdminReplyReviewRequest struct {
	Reply *string `json:"reply" binding:"required"`
}

type AdminDeleteReviewRequest struct {
	Reason string `json:"reason" binding:"required" validate:"min=5"`
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
	OrderID           *int64  `json:"order_id,omitempty"`
	IsEdited          bool    `json:"is_edited"`
	SellerReply       *string `json:"seller_reply,omitempty"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
	DeletedAt         *string `json:"deleted_at,omitempty"`
	DeletedReason     *string `json:"deleted_reason,omitempty"`
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
