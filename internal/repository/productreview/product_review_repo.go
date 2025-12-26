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
	res, err := pr.DB.Exec(`
		INSERT INTO product_reviews (product_id, user_id, rating, body, created_at, updated_at)
		VALUES (?, ?, ?, ?, NOW(), NOW())`,
		review.ProductID, review.UserID, review.Rating, review.Body,
	)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	review.ID = id
	now := time.Now().Format(time.RFC3339)
	review.CreatedAt = now
	review.UpdatedAt = now
	return review, nil
}

func (pr *productReviewRepo) GetProductReviewsByProductID(productID int64) ([]model.ProductReview, error) {
	rows, err := pr.DB.Query(`
		SELECT id, product_id, user_id, rating, body, created_at, updated_at
		FROM product_reviews
		WHERE product_id = ?
		ORDER BY created_at DESC`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := []model.ProductReview{}
	for rows.Next() {
		var r model.ProductReview
		if err := rows.Scan(&r.ID, &r.ProductID, &r.UserID, &r.Rating, &r.Body, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		reviews = append(reviews, r)
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
