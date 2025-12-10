package server

import (
	"golang/internal/handler"
	"golang/internal/router"
	"net/http"
)

type Server struct {
	*http.Server
}

func NewServer(productHandler *handler.ProductHandler) *Server {

	mux := router.NewRouter()

	// Đăng ký route product
	router.RegisterProductRoutes(mux, productHandler)

	return &Server{
		Server: &http.Server{
			Addr:    ":8081",
			Handler: mux,
		},
	}
}
