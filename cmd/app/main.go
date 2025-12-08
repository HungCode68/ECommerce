package main

import (
    "log"
    "golang/internal/server"
)

func main() {
    srv := server.NewServer()
    log.Println("starting server on :8081")
    if err := srv.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}
