package callback

import "golang/internal/model"

type CallbackRepository interface {
	Create(req *model.CallbackRequest) (*model.CallbackRequest, error)
	GetAll(status string, limit, offset int) ([]model.CallbackRequest, error)
	Count(status string) (int, error)
	GetByID(id int64) (*model.CallbackRequest, error)
	Update(req *model.CallbackRequest) (*model.CallbackRequest, error)
	Delete(id int64) error
}
