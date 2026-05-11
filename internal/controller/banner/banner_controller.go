package banner

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	bannerRepo "golang/internal/repository/banner"
)

type bannerController struct {
	repo bannerRepo.BannerRepository
}

func NewBannerController(repo bannerRepo.BannerRepository) BannerController {
	return &bannerController{repo: repo}
}

func stringPtrOrNil(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func (c *bannerController) GetAll() ([]model.Banner, error) {
	return c.repo.GetAll()
}

func (c *bannerController) GetActiveByPosition(position string) ([]model.Banner, error) {
	return c.repo.GetActiveByPosition(position)
}

func (c *bannerController) Create(req model.CreateBannerRequest) (*model.Banner, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	return c.repo.Create(&model.Banner{
		Title:          req.Title,
		ImageURL:       req.ImageURL,
		MobileImageURL: stringPtrOrNil(req.MobileImageURL),
		LinkURL:        stringPtrOrNil(req.LinkURL),
		Position:       req.Position,
		IsActive:       isActive,
		SortOrder:      req.SortOrder,
	})
}

func (c *bannerController) Update(id int64, req model.UpdateBannerRequest) (*model.Banner, error) {
	existing, err := c.repo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("banner not found")
		}
		return nil, err
	}

	if req.Title != nil {
		existing.Title = *req.Title
	}
	if req.ImageURL != nil {
		existing.ImageURL = *req.ImageURL
	}
	if req.MobileImageURL != nil {
		existing.MobileImageURL = req.MobileImageURL
	}
	if req.LinkURL != nil {
		existing.LinkURL = req.LinkURL
	}
	if req.Position != nil {
		existing.Position = *req.Position
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}
	if req.SortOrder != nil {
		existing.SortOrder = *req.SortOrder
	}

	return c.repo.Update(existing)
}

func (c *bannerController) Delete(id int64) error {
	return c.repo.Delete(id)
}

