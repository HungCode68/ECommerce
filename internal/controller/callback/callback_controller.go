package callback

import (
	"database/sql"
	"fmt"
	"golang/internal/model"
	callbackRepo "golang/internal/repository/callback"
)

type callbackController struct {
	repo callbackRepo.CallbackRepository
}

func NewCallbackController(repo callbackRepo.CallbackRepository) CallbackController {
	return &callbackController{repo: repo}
}

func (c *callbackController) Create(req model.CreateCallbackRequest) (*model.CallbackRequest, error) {
	return c.repo.Create(&model.CallbackRequest{
		PhoneNumber: req.PhoneNumber,
		Status:      "pending",
	})
}

func (c *callbackController) GetAll(status string, page, pageSize int) ([]model.CallbackRequest, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize
	list, err := c.repo.GetAll(status, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	total, err := c.repo.Count(status)
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}

func (c *callbackController) UpdateStatus(id int64, req model.UpdateCallbackStatusRequest) (*model.CallbackRequest, error) {
	existing, err := c.repo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("callback request not found")
		}
		return nil, err
	}

	existing.Status = req.Status
	return c.repo.Update(existing)
}

func (c *callbackController) Delete(id int64) error {
	return c.repo.Delete(id)
}
