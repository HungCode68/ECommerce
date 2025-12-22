package router

import (
	"golang/internal/handler/address"
	"golang/internal/middleware"
	"net/http"
)

func NewAddressRouter(mux *http.ServeMux, addressHandler address.AddressHandler) http.Handler {
	// Tạo địa chỉ mới
	addressGroup := newGroup(mux, "/api/addresses", middleware.AuthMiddleware)

	// Định nghĩa các route
	addressGroup.HandleFunc("POST", "", addressHandler.CreateAddress)                 // Tạo mới địa chỉ
	addressGroup.HandleFunc("GET", "", addressHandler.GetMyAddresses)                 // Lấy danh sách địa chỉ của tôi
	addressGroup.HandleFunc("GET", "/{id}", addressHandler.GetAddressByID)            // Xem chi tiết địa chỉ
	addressGroup.HandleFunc("PUT", "/{id}", addressHandler.UpdateAddress)             // Cập nhật địa chỉ
	addressGroup.HandleFunc("DELETE", "/{id}", addressHandler.DeleteAddress)          // Xóa địa chỉ
	addressGroup.HandleFunc("PUT", "/{id}/default", addressHandler.SetDefaultAddress) // Đặt mặc định địa chỉ

	return mux
}
