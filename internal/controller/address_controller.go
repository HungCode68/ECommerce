package controller

import (
	"database/sql"
	"errors"
	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/repository"
)

type AddressController struct {
	AddressRepo repository.AddressRepo
}

func NewAddressController(addressRepo repository.AddressRepo) *AddressController {
	return &AddressController{
		AddressRepo: addressRepo,
	}
}

//Tạo địa chỉ mới
func (c *AddressController) CreateAddress(userID int64, req model.CreateAddressRequest) (model.AddressResponse, error) {
	logger.InfoLogger.Printf("User %d đang tạo địa chỉ mới", userID)

	newAddress := model.Address{
		UserID:            userID, 
		Label:             req.Label,
		RecipientName:     req.RecipientName,
		Phone:             req.Phone,
		Line1:             req.Line1,
		Line2:             req.Line2,
		City:              req.City,
		State:             req.State,
		Country:           req.Country,
		IsDefaultShipping: req.IsDefaultShipping,
		
	}

	createdAddr, err := c.AddressRepo.CreateAddress(newAddress)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi tạo địa chỉ: %v", err)
		return model.AddressResponse{}, err
	}

	
	res := model.AddressResponse{
		ID:                createdAddr.ID,
		UserID:            createdAddr.UserID,
		Label:             createdAddr.Label,
		RecipientName:     createdAddr.RecipientName,
		Phone:             createdAddr.Phone,
		Line1:             createdAddr.Line1,
		Line2:             createdAddr.Line2,
		City:              createdAddr.City,
		State:             createdAddr.State,
		Country:           createdAddr.Country,
		IsDefaultShipping: createdAddr.IsDefaultShipping,
		CreatedAt:         createdAddr.CreatedAt,
		UpdatedAt:         createdAddr.UpdatedAt,
	}

	logger.InfoLogger.Printf("Tạo địa chỉ thành công ID: %d", createdAddr.ID)
	return res, nil
}

//Lấy danh sách địa chỉ của User
func (c *AddressController) GetMyAddresses(userID int64) ([]model.AddressResponse, error) {
	logger.InfoLogger.Printf("Lấy danh sách địa chỉ của User ID: %d", userID)

	addresses, err := c.AddressRepo.GetAddressesByUserID(userID)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi lấy danh sách địa chỉ: %v", err)
		return nil, err
	}

	var res []model.AddressResponse
	for _, addr := range addresses {
		res = append(res, model.AddressResponse{
			ID:                addr.ID,
			UserID:            addr.UserID,
			Label:             addr.Label,
			RecipientName:     addr.RecipientName,
			Phone:             addr.Phone,
			Line1:             addr.Line1,
			Line2:             addr.Line2,
			City:              addr.City,
			State:             addr.State,
			Country:           addr.Country,
			IsDefaultShipping: addr.IsDefaultShipping,
			CreatedAt:         addr.CreatedAt,
			UpdatedAt:         addr.UpdatedAt,
		})
	}

	return res, nil
}

//  Lấy chi tiết 1 địa chỉ (Có check quyền sở hữu)
func (c *AddressController) GetAddressByID(id int64, userID int64) (model.AddressResponse, error) {
	logger.InfoLogger.Printf("User %d xem chi tiết địa chỉ %d", userID, id)

	addr, err := c.AddressRepo.GetAddressByID(id, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return model.AddressResponse{}, errors.New("địa chỉ không tồn tại ")
		}
		logger.ErrorLogger.Printf("Lỗi lấy chi tiết địa chỉ: %v", err)
		return model.AddressResponse{}, err
	}

	res := model.AddressResponse{
		ID:                addr.ID,
		UserID:            addr.UserID,
		Label:             addr.Label,
		RecipientName:     addr.RecipientName,
		Phone:             addr.Phone,
		Line1:             addr.Line1,
		Line2:             addr.Line2,
		City:              addr.City,
		State:             addr.State,
		Country:           addr.Country,
		IsDefaultShipping: addr.IsDefaultShipping,
		CreatedAt:         addr.CreatedAt,
		UpdatedAt:         addr.UpdatedAt,
	}

	return res, nil
}

// Cập nhật địa chỉ
func (c *AddressController) UpdateAddress(id int64, userID int64, req model.UpdateAddressRequest) (model.AddressResponse, error) {
	logger.InfoLogger.Printf("User %d cập nhật địa chỉ %d", userID, id)

	updatedAddr, err := c.AddressRepo.UpdateAddress(id, userID, req)
	if err != nil {
		if err == sql.ErrNoRows {
			return model.AddressResponse{}, errors.New("địa chỉ không tồn tại")
		}
		logger.ErrorLogger.Printf("Lỗi cập nhật địa chỉ: %v", err)
		return model.AddressResponse{}, err
	}

	res := model.AddressResponse{
		ID:                updatedAddr.ID,
		UserID:            updatedAddr.UserID,
		Label:             updatedAddr.Label,
		RecipientName:     updatedAddr.RecipientName,
		Phone:             updatedAddr.Phone,
		Line1:             updatedAddr.Line1,
		Line2:             updatedAddr.Line2,
		City:              updatedAddr.City,
		State:             updatedAddr.State,
		Country:           updatedAddr.Country,
		IsDefaultShipping: updatedAddr.IsDefaultShipping,
		CreatedAt:         updatedAddr.CreatedAt,
		UpdatedAt:         updatedAddr.UpdatedAt,
	}

	return res, nil
}

//  Xóa địa chỉ
func (c *AddressController) DeleteAddress(id int64, userID int64) error {
	logger.WarnLogger.Printf("User %d yêu cầu xóa địa chỉ %d", userID, id)

	err := c.AddressRepo.DeleteAddress(id, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("địa chỉ không tồn tại")
		}
		logger.ErrorLogger.Printf("Lỗi xóa địa chỉ: %v", err)
		return err
	}

	return nil
}

// Đặt địa chỉ mặc định
func (c *AddressController) SetDefaultAddress(userID int64, addressID int64) error {
	logger.InfoLogger.Printf("User %d đặt địa chỉ %d làm mặc định", userID, addressID)

	err := c.AddressRepo.SetDefaultAddress(userID, addressID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("địa chỉ không tồn tại hoặc không thuộc về bạn")
		}
		logger.ErrorLogger.Printf("Lỗi đặt địa chỉ mặc định: %v", err)
		return err
	}

	return nil
}