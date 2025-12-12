package router

import (
	"golang/internal/handler"
	"golang/internal/middleware"
	"net/http"
)

func NewAddressRouter(mux *http.ServeMux ,addressHandler *handler.AddressHandler) http.Handler {

	// Tạo địa chỉ mới
	createHandler := http.HandlerFunc(addressHandler.CreateAddress)
	mux.Handle("POST /api/addresses", middleware.AuthMiddleware(createHandler))

	// Lấy danh sách địa chỉ của tôi
	listHandler := http.HandlerFunc(addressHandler.GetMyAddresses)
	mux.Handle("GET /api/addresses", middleware.AuthMiddleware(listHandler))

	// Lấy chi tiết 1 địa chỉ
	detailHandler := http.HandlerFunc(addressHandler.GetAddressByID)
	mux.Handle("GET /api/addresses/{id}", middleware.AuthMiddleware(detailHandler))

	//  Cập nhật địa chỉ
	updateHandler := http.HandlerFunc(addressHandler.UpdateAddress)
	mux.Handle("PUT /api/addresses/{id}", middleware.AuthMiddleware(updateHandler))

	//  Xóa địa chỉ
	deleteHandler := http.HandlerFunc(addressHandler.DeleteAddress)
	mux.Handle("DELETE /api/addresses/{id}", middleware.AuthMiddleware(deleteHandler))

	// Đặt mặc định
	setDefaultHandler := http.HandlerFunc(addressHandler.SetDefaultAddress)
	mux.Handle("PUT /api/addresses/{id}/default", middleware.AuthMiddleware(setDefaultHandler))

	return mux
}