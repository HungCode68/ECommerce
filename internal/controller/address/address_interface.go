package address

import "golang/internal/model"

// AddressController - Interface định nghĩa các nghiệp vụ xử lý địa chỉ
type AddressController interface {
	// Tạo địa chỉ mới
	CreateAddress(userID int64, req model.CreateAddressRequest) (model.AddressResponse, error)

	// Lấy danh sách địa chỉ của người dùng
	GetMyAddresses(userID int64) ([]model.AddressResponse, error)

	// Lây chi tiết địa chỉ theo ID
	GetAddressByID(id int64, userID int64) (model.AddressResponse, error)

	// Cập nhật địa chỉ
	UpdateAddress(id int64, userID int64, req model.UpdateAddressRequest) (model.AddressResponse, error)

	// Xoá địa chỉ
	DeleteAddress(id int64, userID int64) error

	// Đặt địa chỉ mặc định
	SetDefaultAddress(userID int64, addressID int64) error
}