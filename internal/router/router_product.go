package router

import (
	"golang/internal/handler"
	"net/http"
)

func RegisterProductRoutes(mux *http.ServeMux, h *handler.ProductHandler) {
	//Admin
	mux.HandleFunc("POST /admin/product", h.CreateProductHandler)
	mux.HandleFunc("GET /admin/product/", h.AdminGetProductHandler)
	mux.HandleFunc("GET /admin/product/{id}", h.AdminGetProductHandler)
	mux.HandleFunc("GET /admin/product/slug/{slug}", h.AdminGetProductHandler)
	mux.HandleFunc("POST /admin/products/many", h.AdminGetManyProductController)

	//user
	mux.HandleFunc("GET /user/products/detail/", h.UserGetProductHandlerDetail)
	mux.HandleFunc("GET /user/product/detail/{id}", h.UserGetProductHandlerDetail)
	mux.HandleFunc("GET /user/product/detail/slug/{slug}", h.UserGetProductHandlerDetail)

	mux.HandleFunc("GET /user/products/", h.UserGetProductHandler)
	mux.HandleFunc("GET /user/product/{id}", h.UserGetProductHandler)
	mux.HandleFunc("GET /user/product/slug/{slug}", h.UserGetProductHandler)
}
