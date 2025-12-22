package address

import "net/http"

// AddressHandler - Interface định nghĩa các hàm xử lý HTTP cho địa chỉ
type AddressHandler interface {
	// Tạo dia chỉ mới
	CreateAddress(w http.ResponseWriter, r *http.Request)
	
	// Lấy danh sách địa chỉ của người dùng
	GetMyAddresses(w http.ResponseWriter, r *http.Request)

	// Lây chi tiết địa chỉ theo ID
	GetAddressByID(w http.ResponseWriter, r *http.Request)

	// Cập nhật địa chỉ
	UpdateAddress(w http.ResponseWriter, r *http.Request)

	// Xoá địa chỉ
	DeleteAddress(w http.ResponseWriter, r *http.Request)

	// Đặt địa chỉ mặc định
	SetDefaultAddress(w http.ResponseWriter, r *http.Request)
}