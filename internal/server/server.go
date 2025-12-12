package server

import (
	"net/http"
	"time"
)

type Server struct {
	*http.Server
}

// SỬA: Thêm tham số handler vào đây
func NewServer(handler http.Handler) *Server {
	return &Server{
		Server: &http.Server{
			Addr:         ":8081",
			Handler:      handler, // Gán router được truyền vào
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
		},
	}
}
