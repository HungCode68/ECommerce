package server

import (
	"net/http"
	"golang/internal/router" 
)

type Server struct {
	*http.Server
}

func NewServer() *Server {
	// 1. Gọi sang package router để lấy mux về
	mux := router.NewRouter()

	// 2. Gắn mux vào server
	return &Server{
		Server: &http.Server{
			Addr:    ":8081",
			Handler: mux,
		},
	}
}