package productreview

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"golang/internal/model"
	"time"
)

type productReviewRepo struct {
	DB *sql.DB
}

func NewProductReviewRepo(db *sql.DB) ProductReviewRepository {
	return &productReviewRepo{
		DB: db,
	}
}
func (pr *productReviewRepo) CreateProductReview(review *model.ProductReview) (*model.ProductReview, error) {
	tx, err := pr.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	res, err := tx.Exec(`
		INSERT INTO product_reviews (
			product_id,
			user_id,
			order_id,
			rating,
			performance_rating,
			battery_rating,
			camera_rating,
			body,
			is_edited,
			created_at,
			updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
		review.ProductID,
		review.UserID,
		review.OrderID,
		review.Rating,
		review.PerformanceRating,
		review.BatteryRating,
		review.CameraRating,
		review.Body,
		review.IsEdited,
	)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	review.ID = id

	for index, imageURL := range review.ImageURLs {
		if imageURL == "" {
			continue
		}
		if _, err := tx.Exec(`
			INSERT INTO product_review_images (review_id, image_url, sort_order)
			VALUES (?, ?, ?)`,
			review.ID, imageURL, index,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	now := time.Now().Format(time.RFC3339)
	review.CreatedAt = now
	review.UpdatedAt = now
	return review, nil
}

func (pr *productReviewRepo) GetProductReviewsByProductID(productID int64) ([]model.ProductReview, error) {
	rows, err := pr.DB.Query(`
		SELECT
			pr.id,
			pr.product_id,
			pr.user_id,
			pr.rating,
			pr.performance_rating,
			pr.battery_rating,
			pr.camera_rating,
			pr.body,
			pr.order_id,
			pr.is_edited,
			pr.seller_reply,
			pr.created_at,
			pr.updated_at,
		       COALESCE(u.username, '') as user_name
		FROM product_reviews pr
		LEFT JOIN users u ON u.id = pr.user_id
		WHERE pr.product_id = ? AND pr.deleted_at IS NULL
		ORDER BY created_at DESC`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := []model.ProductReview{}
	for rows.Next() {
		var r model.ProductReview
		if err := rows.Scan(
			&r.ID,
			&r.ProductID,
			&r.UserID,
			&r.Rating,
			&r.PerformanceRating,
			&r.BatteryRating,
			&r.CameraRating,
			&r.Body,
			&r.OrderID,
			&r.IsEdited,
			&r.SellerReply,
			&r.CreatedAt,
			&r.UpdatedAt,
			&r.UserName,
		); err != nil {
			return nil, err
		}
		r.VerifiedPurchase = true
		reviews = append(reviews, r)
	}

	if len(reviews) == 0 {
		return reviews, nil
	}

	imageRows, err := pr.DB.Query(`
		SELECT review_id, image_url
		FROM product_review_images
		WHERE review_id IN (
			SELECT id FROM product_reviews WHERE product_id = ?
		)
		ORDER BY review_id ASC, sort_order ASC, id ASC`,
		productID,
	)
	if err != nil {
		return nil, err
	}
	defer imageRows.Close()

	imagesByReviewID := make(map[int64][]string)
	for imageRows.Next() {
		var reviewID int64
		var imageURL string
		if err := imageRows.Scan(&reviewID, &imageURL); err != nil {
			return nil, err
		}
		imagesByReviewID[reviewID] = append(imagesByReviewID[reviewID], imageURL)
	}

	for index := range reviews {
		reviews[index].ImageURLs = imagesByReviewID[reviews[index].ID]
	}

	return reviews, nil
}

func (pr *productReviewRepo) GetAverageRatingByProductID(productID int64) (float64, error) {
	var avg sql.NullFloat64
	err := pr.DB.QueryRow(`SELECT AVG(rating) FROM product_reviews WHERE product_id = ? AND deleted_at IS NULL`, productID).Scan(&avg)
	if err != nil {
		return 0, err
	}
	if !avg.Valid {
		return 0, nil
	}
	return avg.Float64, nil
}

func (pr *productReviewRepo) GetCountRatingByProductID(productID int64) (int64, error) {
	var count int64


	if err := pr.DB.QueryRow(`SELECT COUNT(*) FROM product_reviews WHERE product_id = ? AND deleted_at IS NULL`, productID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func (pr *productReviewRepo) DeleteReviewByID(reviewID int64) error {
	_, err := pr.DB.Exec(`DELETE FROM product_reviews WHERE id = ?`, reviewID)
	return err
}

func (pr *productReviewRepo) HasOrderReviewedProduct(orderID int64, productID int64) (bool, error) {
	var count int
	err := pr.DB.QueryRow(`SELECT COUNT(*) FROM product_reviews WHERE order_id = ? AND product_id = ?`, orderID, productID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (pr *productReviewRepo) UpdateProductRating(productID int64, avgRating float64, count int64) error {
	_, err := pr.DB.Exec(`UPDATE products SET avg_rating = ?, rating_count = ? WHERE id = ?`, avgRating, count, productID)
	return err
}

func (pr *productReviewRepo) GetReviewByID(reviewID int64) (*model.ProductReview, error) {
	row := pr.DB.QueryRow(`
		SELECT r.id, r.product_id, r.order_id, r.user_id, r.rating, r.performance_rating, r.battery_rating, r.camera_rating, r.body, r.image_urls, r.is_edited, r.seller_reply, r.created_at, r.updated_at
		FROM product_reviews r
		WHERE r.id = ?`, reviewID)

	var review model.ProductReview
	var imageUrls *string
	err := row.Scan(&review.ID, &review.ProductID, &review.OrderID, &review.UserID, &review.Rating, &review.PerformanceRating, &review.BatteryRating, &review.CameraRating, &review.Body, &imageUrls, &review.IsEdited, &review.SellerReply, &review.CreatedAt, &review.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if imageUrls != nil && *imageUrls != "" {
		_ = json.Unmarshal([]byte(*imageUrls), &review.ImageURLs)
	}

	return &review, nil
}

func (pr *productReviewRepo) GetReviewByOrderAndProduct(orderID int64, productID int64, userID int64) (*model.ProductReview, error) {
	row := pr.DB.QueryRow(`
		SELECT r.id, r.product_id, r.order_id, r.user_id, r.rating, r.performance_rating, r.battery_rating, r.camera_rating, r.body, r.image_urls, r.is_edited, r.seller_reply, r.created_at, r.updated_at
		FROM product_reviews r
		WHERE (r.order_id = ? OR r.order_id IS NULL) AND r.product_id = ? AND r.user_id = ? LIMIT 1`, orderID, productID, userID)

	var review model.ProductReview
	var imageUrls *string
	err := row.Scan(&review.ID, &review.ProductID, &review.OrderID, &review.UserID, &review.Rating, &review.PerformanceRating, &review.BatteryRating, &review.CameraRating, &review.Body, &imageUrls, &review.IsEdited, &review.SellerReply, &review.CreatedAt, &review.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if imageUrls != nil && *imageUrls != "" {
		_ = json.Unmarshal([]byte(*imageUrls), &review.ImageURLs)
	}

	return &review, nil
}

func (pr *productReviewRepo) UpdateReview(review *model.ProductReview) error {
	imageUrlsJSON, _ := json.Marshal(review.ImageURLs)
	_, err := pr.DB.Exec(`
		UPDATE product_reviews 
		SET rating = ?, performance_rating = ?, battery_rating = ?, camera_rating = ?, body = ?, image_urls = ?, is_edited = ?
		WHERE id = ?`,
		review.Rating, review.PerformanceRating, review.BatteryRating, review.CameraRating, review.Body, string(imageUrlsJSON), review.IsEdited, review.ID)
	return err
}

func (pr *productReviewRepo) UpdateSellerReply(reviewID int64, reply *string) error {
	_, err := pr.DB.Exec(`UPDATE product_reviews SET seller_reply = ? WHERE id = ?`, reply, reviewID)
	return err
}

func (pr *productReviewRepo) GetAllReviews(offset int, limit int) ([]model.ProductReview, int64, error) {
	var total int64
	err := pr.DB.QueryRow(`SELECT COUNT(*) FROM product_reviews`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := pr.DB.Query(`
		SELECT r.id, r.product_id, r.order_id, r.user_id, u.username, r.rating, r.performance_rating, r.battery_rating, r.camera_rating, r.body, r.image_urls, r.is_edited, r.seller_reply, r.created_at, r.updated_at, r.deleted_at, r.deleted_reason
		FROM product_reviews r
		LEFT JOIN users u ON r.user_id = u.id
		ORDER BY r.created_at DESC
		LIMIT ? OFFSET ?`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reviews []model.ProductReview
	var reviewIDs []interface{}
	for rows.Next() {
		var review model.ProductReview
		var imageUrls *string
		var userName sql.NullString
		var deletedAt, deletedReason sql.NullString
		if err := rows.Scan(&review.ID, &review.ProductID, &review.OrderID, &review.UserID, &userName, &review.Rating, &review.PerformanceRating, &review.BatteryRating, &review.CameraRating, &review.Body, &imageUrls, &review.IsEdited, &review.SellerReply, &review.CreatedAt, &review.UpdatedAt, &deletedAt, &deletedReason); err != nil {
			return nil, 0, err
		}
		if imageUrls != nil && *imageUrls != "" {
			_ = json.Unmarshal([]byte(*imageUrls), &review.ImageURLs)
		}
		if userName.Valid {
			review.UserName = userName.String
		}
		if deletedAt.Valid {
			review.DeletedAt = &deletedAt.String
		}
		if deletedReason.Valid {
			review.DeletedReason = &deletedReason.String
		}
		reviews = append(reviews, review)
		reviewIDs = append(reviewIDs, review.ID)
	}

	if len(reviews) > 0 {
		placeholders := ""
		for i := 0; i < len(reviewIDs); i++ {
			if i > 0 {
				placeholders += ", "
			}
			placeholders += "?"
		}

		query := fmt.Sprintf(`
			SELECT review_id, image_url
			FROM product_review_images
			WHERE review_id IN (%s)
			ORDER BY review_id ASC, sort_order ASC, id ASC`, placeholders)

		imageRows, err := pr.DB.Query(query, reviewIDs...)
		if err == nil {
			defer imageRows.Close()
			imagesByReviewID := make(map[int64][]string)
			for imageRows.Next() {
				var reviewID int64
				var imageURL string
				if err := imageRows.Scan(&reviewID, &imageURL); err == nil {
					imagesByReviewID[reviewID] = append(imagesByReviewID[reviewID], imageURL)
				}
			}

			for i := range reviews {
				if imgs, ok := imagesByReviewID[reviews[i].ID]; ok && len(imgs) > 0 {
					reviews[i].ImageURLs = append(reviews[i].ImageURLs, imgs...)
				}
			}
		}
	}

	return reviews, total, nil
}

func (pr *productReviewRepo) AdminSoftDeleteReview(reviewID int64, reason string) error {
	_, err := pr.DB.Exec(`UPDATE product_reviews SET deleted_at = NOW(), deleted_reason = ? WHERE id = ?`, reason, reviewID)
	return err
}
