package banner

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
)

type bannerRepo struct {
	db *sql.DB
}

func NewBannerRepo(db *sql.DB) BannerRepository {
	return &bannerRepo{db: db}
}

func (r *bannerRepo) GetAll() ([]model.Banner, error) {
	rows, err := r.db.Query(`
		SELECT id, title, image_url, mobile_image_url, link_url, position, is_active, sort_order, created_at, updated_at
		FROM banners
		ORDER BY position ASC, sort_order ASC, id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var banners []model.Banner
	for rows.Next() {
		var banner model.Banner
		if err := rows.Scan(
			&banner.ID,
			&banner.Title,
			&banner.ImageURL,
			&banner.MobileImageURL,
			&banner.LinkURL,
			&banner.Position,
			&banner.IsActive,
			&banner.SortOrder,
			&banner.CreatedAt,
			&banner.UpdatedAt,
		); err != nil {
			return nil, err
		}
		banners = append(banners, banner)
	}
	return banners, nil
}

func (r *bannerRepo) GetActiveByPosition(position string) ([]model.Banner, error) {
	rows, err := r.db.Query(`
		SELECT id, title, image_url, mobile_image_url, link_url, position, is_active, sort_order, created_at, updated_at
		FROM banners
		WHERE position = ? AND is_active = 1
		ORDER BY sort_order ASC, id DESC`, position)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var banners []model.Banner
	for rows.Next() {
		var banner model.Banner
		if err := rows.Scan(
			&banner.ID,
			&banner.Title,
			&banner.ImageURL,
			&banner.MobileImageURL,
			&banner.LinkURL,
			&banner.Position,
			&banner.IsActive,
			&banner.SortOrder,
			&banner.CreatedAt,
			&banner.UpdatedAt,
		); err != nil {
			return nil, err
		}
		banners = append(banners, banner)
	}
	return banners, nil
}

func (r *bannerRepo) GetByID(id int64) (*model.Banner, error) {
	var banner model.Banner
	err := r.db.QueryRow(`
		SELECT id, title, image_url, mobile_image_url, link_url, position, is_active, sort_order, created_at, updated_at
		FROM banners
		WHERE id = ?`, id).Scan(
		&banner.ID,
		&banner.Title,
		&banner.ImageURL,
		&banner.MobileImageURL,
		&banner.LinkURL,
		&banner.Position,
		&banner.IsActive,
		&banner.SortOrder,
		&banner.CreatedAt,
		&banner.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &banner, nil
}

func (r *bannerRepo) Create(banner *model.Banner) (*model.Banner, error) {
	res, err := r.db.Exec(`
		INSERT INTO banners (title, image_url, mobile_image_url, link_url, position, is_active, sort_order)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		banner.Title,
		banner.ImageURL,
		banner.MobileImageURL,
		banner.LinkURL,
		banner.Position,
		banner.IsActive,
		banner.SortOrder,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

func (r *bannerRepo) Update(banner *model.Banner) (*model.Banner, error) {
	res, err := r.db.Exec(`
		UPDATE banners
		SET title = ?, image_url = ?, mobile_image_url = ?, link_url = ?, position = ?, is_active = ?, sort_order = ?, updated_at = NOW()
		WHERE id = ?`,
		banner.Title,
		banner.ImageURL,
		banner.MobileImageURL,
		banner.LinkURL,
		banner.Position,
		banner.IsActive,
		banner.SortOrder,
		banner.ID,
	)
	if err != nil {
		return nil, err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rowsAffected == 0 {
		return nil, fmt.Errorf("banner not found")
	}
	return r.GetByID(banner.ID)
}

func (r *bannerRepo) Delete(id int64) error {
	res, err := r.db.Exec(`DELETE FROM banners WHERE id = ?`, id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("banner not found")
	}
	return nil
}

