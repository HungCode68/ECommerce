package banner

import "golang/internal/model"

type BannerRepository interface {
	GetAll() ([]model.Banner, error)
	GetActiveByPosition(position string) ([]model.Banner, error)
	GetByID(id int64) (*model.Banner, error)
	Create(req *model.Banner) (*model.Banner, error)
	Update(req *model.Banner) (*model.Banner, error)
	Delete(id int64) error
}

