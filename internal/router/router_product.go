package router

import (
	"golang/internal/handler"
	"net/http"
)

func RegisterProductRoutes(mux *http.ServeMux, h *handler.ProductHandler) {
	// Admin routes
	mux.HandleFunc("POST /admin/product", h.CreateProductHandler)
	mux.HandleFunc("GET /admin/product/", h.AdminGetProductHandler)
	mux.HandleFunc("GET /admin/product/{id}", h.AdminGetProductHandler)
	mux.HandleFunc("GET /admin/product/slug/{slug}", h.AdminGetProductHandler)
	mux.HandleFunc("GET /admin/product/all", h.AdminGetAllProductHandler)
	mux.HandleFunc("POST /admin/products/many", h.AdminGetManyProductController)
	mux.HandleFunc("POST /admin/products/search", h.AdminSearchProductsHandler)
	mux.HandleFunc("PUT /admin/product/update/{id}", h.UpdateProductHandler)
	mux.HandleFunc("DELETE /admin/product/delesoft/{id}", h.AdminDeleteSoftProductHandler)
	mux.HandleFunc("GET /admin/products/deleted", h.AdminGetAllSoftDeletedProductsHandler)
	mux.HandleFunc("DELETE /admin/products/delesoft/all",h.AdminBulkDeleteSoftProductsHandler)

	// User routes
	mux.HandleFunc("GET /user/products/detail/", h.UserGetProductHandlerDetail)
	mux.HandleFunc("GET /user/product/detail/{id}", h.UserGetProductHandlerDetail)
	mux.HandleFunc("GET /user/product/detail/slug/{slug}", h.UserGetProductHandlerDetail)

	mux.HandleFunc("GET /user/products/", h.UserGetProductHandler)
	mux.HandleFunc("GET /user/product/{id}", h.UserGetProductHandler)
	mux.HandleFunc("GET /user/product/slug/{slug}", h.UserGetProductHandler)

	mux.HandleFunc("POST /user/products/search", h.UserSearchProductHandler)
}
