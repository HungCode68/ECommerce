package server

import (
	"golang/internal/handler"
	"golang/internal/router"
	"net/http"
<<<<<<< HEAD
	"time"
=======
>>>>>>> df8a219 (up)
)

type Server struct {
	*http.Server
}

<<<<<<< HEAD
// SỬA: Thêm tham số handler vào đây
func NewServer(handler http.Handler) *Server {
=======
func NewServer(productHandler *handler.ProductHandler) *Server {

	mux := router.NewRouter()

	// Đăng ký route product
	router.RegisterProductRoutes(mux, productHandler)

>>>>>>> df8a219 (up)
	return &Server{
		Server: &http.Server{
			Addr:         ":8081",
			Handler:      handler, // Gán router được truyền vào
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
		},
	}
}
