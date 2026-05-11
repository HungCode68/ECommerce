package banner

import "golang/internal/model"

type BannerController interface {
	GetAll() ([]model.Banner, error)
	GetActiveByPosition(position string) ([]model.Banner, error)
	Create(req model.CreateBannerRequest) (*model.Banner, error)
	Update(id int64, req model.UpdateBannerRequest) (*model.Banner, error)
	Delete(id int64) error
}

