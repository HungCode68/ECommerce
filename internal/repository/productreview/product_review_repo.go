package productreview

import (
	"database/sql"
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
			rating,
			performance_rating,
			battery_rating,
			camera_rating,
			body,
			created_at,
			updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
		review.ProductID,
		review.UserID,
		review.Rating,
		review.PerformanceRating,
		review.BatteryRating,
		review.CameraRating,
		review.Body,
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
			pr.created_at,
			pr.updated_at,
		       COALESCE(u.username, '') as user_name
		FROM product_reviews pr
		LEFT JOIN users u ON u.id = pr.user_id
		WHERE pr.product_id = ?
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
	err := pr.DB.QueryRow(`SELECT AVG(rating) FROM product_reviews WHERE product_id = ?`, productID).Scan(&avg)
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
	if err := pr.DB.QueryRow(`SELECT COUNT(*) FROM product_reviews WHERE product_id = ?`, productID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func (pr *productReviewRepo) DeleteReviewByID(reviewID int64) error {
	_, err := pr.DB.Exec(`DELETE FROM product_reviews WHERE id = ?`, reviewID)
	return err
}
