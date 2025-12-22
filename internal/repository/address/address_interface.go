package address

import (
	"golang/internal/model"
)

// AddressRepo - Interface định nghĩa các hành động
type AddressRepo interface {
	CreateAddress(address model.Address) (model.Address, error)
	GetAddressByID(id int64, userID int64) (model.Address, error)
	GetAddressesByUserID(userID int64) ([]model.Address, error)
	UpdateAddress(id int64, userID int64, req model.UpdateAddressRequest) (model.Address, error)
	DeleteAddress(id int64, userID int64) error
	SetDefaultAddress(userID int64, addressID int64) error
}