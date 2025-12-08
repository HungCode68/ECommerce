package server
import (
    "fmt"
    "net/http"
)

type Server struct {
    *http.Server
}

func NewServer() *Server {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, "Hello World")
    })

    return &Server{
        Server: &http.Server{
            Addr:    ":8081",
            Handler: mux,
        },
    }
}