package productreviews

import (
	"context"
	"errors"
	"fmt"
	"golang/internal/model"
	order "golang/internal/repository/order"
	"golang/internal/repository/productreview"
	notificationrepo "golang/internal/repository/notification"
	"time"
)

type productReviewsController struct {
	reviewRepo productreview.ProductReviewRepository
	orderRepo  order.IOrderRepository
	notifRepo  notificationrepo.NotificationRepository
}

// NewProductReviewsController wires repository into controller layer.
func NewProductReviewsController(repo productreview.ProductReviewRepository, orderRepo order.IOrderRepository, notifRepo notificationrepo.NotificationRepository) ProductReviewsController {
	return &productReviewsController{reviewRepo: repo, orderRepo: orderRepo, notifRepo: notifRepo}
}

func (c *productReviewsController) CreateReview(ctx context.Context, req model.CreateProductReviewRequest, productID int64, userID int64) (*model.CreateProductReviewResponse, error) {
	// 1. Fetch the specific order and verify eligibility
	orderData, err := c.orderRepo.GetOrderByID(ctx, req.OrderID)
	if err != nil {
		return nil, errors.New("không tìm thấy đơn hàng hoặc lỗi hệ thống")
	}

	if orderData.UserID != userID {
		return nil, errors.New("bạn không có quyền đánh giá đơn hàng này")
	}

	if orderData.Status != model.OrderStatusCompleted {
		return nil, errors.New("đơn hàng phải ở trạng thái hoàn thành mới được đánh giá")
	}

	// 2. 15-day time window check
	if orderData.CompletedAt != nil {
		if time.Since(*orderData.CompletedAt) > 15*24*time.Hour {
			return nil, errors.New("đã quá hạn 15 ngày để đánh giá sản phẩm này")
		}
	} else {
		// Fallback if completed_at is somehow null but status is completed
		if time.Since(orderData.UpdatedAt) > 15*24*time.Hour {
			return nil, errors.New("đã quá hạn 15 ngày để đánh giá sản phẩm này")
		}
	}

	// 3. Verify order actually contains this product
	items, err := c.orderRepo.GetOrderItems(ctx, req.OrderID)
	if err != nil {
		return nil, errors.New("không thể lấy thông tin sản phẩm trong đơn hàng")
	}
	hasProduct := false
	for _, item := range items {
		if item.ProductID == productID {
			hasProduct = true
			break
		}
	}
	if !hasProduct {
		return nil, errors.New("sản phẩm này không nằm trong đơn hàng của bạn")
	}

	// 4. Quantity & Frequency: 1 order = 1 review per product
	hasReviewed, err := c.reviewRepo.HasOrderReviewedProduct(req.OrderID, productID)
	if err != nil {
		return nil, errors.New("lỗi hệ thống khi kiểm tra dữ liệu đánh giá")
	}
	if hasReviewed {
		return nil, errors.New("bạn đã đánh giá sản phẩm này cho đơn hàng trên rồi")
	}

	toCreate := &model.ProductReview{
		ProductID:         productID,
		OrderID:           &req.OrderID,
		Body:              req.Body,
		Rating:            req.Rating,
		PerformanceRating: req.PerformanceRating,
		BatteryRating:     req.BatteryRating,
		CameraRating:      req.CameraRating,
		ImageURLs:         req.ImageURLs,
		UserID:            userID,
		IsEdited:          false,
	}

	created, err := c.reviewRepo.CreateProductReview(toCreate)
	if err != nil {
		return nil, err
	}

	// 5. Rating Calculation (Real-time)
	avgRating, _ := c.reviewRepo.GetAverageRatingByProductID(productID)
	ratingCount, _ := c.reviewRepo.GetCountRatingByProductID(productID)
	_ = c.reviewRepo.UpdateProductRating(productID, avgRating, ratingCount)

	resp := model.ProductReviewResponse{
		ID:                created.ID,
		ProductID:         created.ProductID,
		OrderID:           created.OrderID,
		Body:              created.Body,
		Rating:            created.Rating,
		PerformanceRating: created.PerformanceRating,
		BatteryRating:     created.BatteryRating,
		CameraRating:      created.CameraRating,
		ImageURLs:         created.ImageURLs,
		UserID:            created.UserID,
		UserName:          created.UserName,
		VerifiedPurchase:  true,
		IsEdited:          created.IsEdited,
		SellerReply:       created.SellerReply,
		CreatedAt:         created.CreatedAt,
		UpdatedAt:         created.UpdatedAt,
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
	ratingBreakdown := make(map[int]int64)
	var performanceTotal float64
	var batteryTotal float64
	var cameraTotal float64
	for _, r := range reviews {
		ratingBreakdown[r.Rating]++
		performanceTotal += float64(r.PerformanceRating)
		batteryTotal += float64(r.BatteryRating)
		cameraTotal += float64(r.CameraRating)
		respReviews = append(respReviews, model.ProductReviewResponse{
			ID:                r.ID,
			ProductID:         r.ProductID,
			OrderID:           r.OrderID,
			Body:              r.Body,
			Rating:            r.Rating,
			PerformanceRating: r.PerformanceRating,
			BatteryRating:     r.BatteryRating,
			CameraRating:      r.CameraRating,
			ImageURLs:         r.ImageURLs,
			UserID:            r.UserID,
			UserName:          r.UserName,
			VerifiedPurchase:  r.VerifiedPurchase,
			IsEdited:          r.IsEdited,
			SellerReply:       r.SellerReply,
			CreatedAt:         r.CreatedAt,
			UpdatedAt:         r.UpdatedAt,
		})
	}

	var performanceAvg float64
	var batteryAvg float64
	var cameraAvg float64
	if len(reviews) > 0 {
		countFloat := float64(len(reviews))
		performanceAvg = performanceTotal / countFloat
		batteryAvg = batteryTotal / countFloat
		cameraAvg = cameraTotal / countFloat
	}

	breakdown := make([]model.RatingBreakdownItem, 0, 5)
	for star := 5; star >= 1; star-- {
		breakdown = append(breakdown, model.RatingBreakdownItem{
			Rating: star,
			Count:  ratingBreakdown[star],
		})
	}

	return &model.ProductReviewListResponse{
		Message:         "Reviews fetched successfully",
		ProductID:       productID,
		AvgRating:       avg,
		RatingCount:     count,
		PerformanceAvg:  performanceAvg,
		BatteryAvg:      batteryAvg,
		CameraAvg:       cameraAvg,
		RatingBreakdown: breakdown,
		Reviews:         respReviews,
	}, nil
}
func (c *productReviewsController) DeleteReview(ctx context.Context, reviewID int64, userID int64) (*model.DeleteProductReviewResponse, error) {
	review, err := c.reviewRepo.GetReviewByID(reviewID)
	if err != nil {
		fmt.Printf("GetReviewByID err: %v\n", err)
		return nil, errors.New("không tìm thấy đánh giá")
	}

	if review.UserID != userID {
		return nil, errors.New("bạn không có quyền xóa đánh giá này")
	}

	createdAt, _ := time.Parse(time.RFC3339, review.CreatedAt)
	if time.Since(createdAt) > 48*time.Hour {
		return nil, errors.New("đã quá 48h, không thể xóa đánh giá này nữa")
	}

	if err := c.reviewRepo.DeleteReviewByID(reviewID); err != nil {
		return nil, err
	}

	// Recalculate rating
	avgRating, _ := c.reviewRepo.GetAverageRatingByProductID(review.ProductID)
	ratingCount, _ := c.reviewRepo.GetCountRatingByProductID(review.ProductID)
	_ = c.reviewRepo.UpdateProductRating(review.ProductID, avgRating, ratingCount)

	return &model.DeleteProductReviewResponse{Message: "Review deleted successfully"}, nil
}

func (c *productReviewsController) GetUserReviewByOrder(ctx context.Context, orderID int64, productID int64, userID int64) (*model.ProductReviewResponse, error) {
	review, err := c.reviewRepo.GetReviewByOrderAndProduct(orderID, productID, userID)
	if err != nil {
		fmt.Printf("GetReviewByOrderAndProduct err: %v\n", err)
		return nil, errors.New("không tìm thấy đánh giá")
	}

	if review.UserID != userID {
		return nil, errors.New("không có quyền truy cập đánh giá này")
	}

	return &model.ProductReviewResponse{
		ID:                review.ID,
		ProductID:         review.ProductID,
		OrderID:           review.OrderID,
		Body:              review.Body,
		Rating:            review.Rating,
		PerformanceRating: review.PerformanceRating,
		BatteryRating:     review.BatteryRating,
		CameraRating:      review.CameraRating,
		ImageURLs:         review.ImageURLs,
		UserID:            review.UserID,
		IsEdited:          review.IsEdited,
		SellerReply:       review.SellerReply,
		CreatedAt:         review.CreatedAt,
		UpdatedAt:         review.UpdatedAt,
	}, nil
}

func (c *productReviewsController) EditUserReview(ctx context.Context, reviewID int64, req model.UpdateProductReviewRequest, userID int64) (*model.ProductReviewResponse, error) {
	review, err := c.reviewRepo.GetReviewByID(reviewID)
	if err != nil {
		fmt.Printf("GetReviewByID err: %v\n", err)
		return nil, errors.New("không tìm thấy đánh giá")
	}

	if review.UserID != userID {
		return nil, errors.New("bạn không có quyền sửa đánh giá này")
	}

	if review.IsEdited {
		return nil, errors.New("bạn đã sửa đánh giá này rồi (chỉ được sửa 1 lần)")
	}

	createdAt, _ := time.Parse(time.RFC3339, review.CreatedAt)
	if time.Since(createdAt) > 48*time.Hour {
		return nil, errors.New("đã quá 48h, không thể sửa đánh giá này nữa")
	}

	review.Rating = req.Rating
	review.PerformanceRating = req.PerformanceRating
	review.BatteryRating = req.BatteryRating
	review.CameraRating = req.CameraRating
	review.Body = req.Body
	review.ImageURLs = req.ImageURLs
	review.IsEdited = true

	if err := c.reviewRepo.UpdateReview(review); err != nil {
		return nil, err
	}

	// Recalculate rating
	avgRating, _ := c.reviewRepo.GetAverageRatingByProductID(review.ProductID)
	ratingCount, _ := c.reviewRepo.GetCountRatingByProductID(review.ProductID)
	_ = c.reviewRepo.UpdateProductRating(review.ProductID, avgRating, ratingCount)

	return c.GetUserReviewByOrder(ctx, *review.OrderID, review.ProductID, userID)
}

func (c *productReviewsController) AdminReplyToReview(ctx context.Context, reviewID int64, req model.AdminReplyReviewRequest) error {
	review, err := c.reviewRepo.GetReviewByID(reviewID)
	if err != nil {
		return errors.New("không tìm thấy đánh giá")
	}

	createdAt, _ := time.Parse(time.RFC3339, review.CreatedAt)
	if time.Since(createdAt) > 48*time.Hour {
		return errors.New("đã quá 48h kể từ khi user đánh giá, không thể phản hồi/sửa phản hồi nữa")
	}

	return c.reviewRepo.UpdateSellerReply(reviewID, req.Reply)
}

func (c *productReviewsController) GetAllReviews(offset int, limit int) ([]model.ProductReviewResponse, int64, error) {
	reviews, total, err := c.reviewRepo.GetAllReviews(offset, limit)
	if err != nil {
		return nil, 0, err
	}

	respReviews := make([]model.ProductReviewResponse, 0, len(reviews))
	for _, r := range reviews {
		respReviews = append(respReviews, model.ProductReviewResponse{
			ID:                r.ID,
			ProductID:         r.ProductID,
			OrderID:           r.OrderID,
			Body:              r.Body,
			Rating:            r.Rating,
			PerformanceRating: r.PerformanceRating,
			BatteryRating:     r.BatteryRating,
			CameraRating:      r.CameraRating,
			ImageURLs:         r.ImageURLs,
			UserID:            r.UserID,
			UserName:          r.UserName,
			IsEdited:          r.IsEdited,
			SellerReply:       r.SellerReply,
			CreatedAt:         r.CreatedAt,
			UpdatedAt:         r.UpdatedAt,
			DeletedAt:         r.DeletedAt,
			DeletedReason:     r.DeletedReason,
		})
	}
	return respReviews, total, nil
}

func (c *productReviewsController) AdminDeleteReview(ctx context.Context, reviewID int64, reason string) error {
	review, err := c.reviewRepo.GetReviewByID(reviewID)
	if err != nil {
		return errors.New("không tìm thấy đánh giá")
	}

	if err := c.reviewRepo.AdminSoftDeleteReview(reviewID, reason); err != nil {
		return err
	}

	// Recalculate average rating for the product
	avgRating, _ := c.reviewRepo.GetAverageRatingByProductID(review.ProductID)
	ratingCount, _ := c.reviewRepo.GetCountRatingByProductID(review.ProductID)
	_ = c.reviewRepo.UpdateProductRating(review.ProductID, avgRating, ratingCount)

	// Notify the user
	go func() {
		notif := &model.Notification{
			UserID:  review.UserID,
			Title:   "Đánh giá sản phẩm đã bị xóa",
			Message: fmt.Sprintf("Đánh giá của bạn đã bị xóa với lý do: %s", reason),
			Type:    "REVIEW_DELETED",
			IsRead:  false,
		}
		_ = c.notifRepo.Create(notif)
	}()

	return nil
}
