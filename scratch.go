package main

import (
	"fmt"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/admin/audit-logs", func(w http.ResponseWriter, r *http.Request) {})
	fmt.Println("No panic!")
}
