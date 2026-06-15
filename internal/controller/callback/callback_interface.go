package callback

import "golang/internal/model"

type CallbackController interface {
	Create(req model.CreateCallbackRequest) (*model.CallbackRequest, error)
	GetAll(status string, page, pageSize int) ([]model.CallbackRequest, int, error)
	UpdateStatus(id int64, req model.UpdateCallbackStatusRequest) (*model.CallbackRequest, error)
	Delete(id int64) error
}
