package router

import (
	"fmt"
	"net/http"
)


func NewRouter() *http.ServeMux {
	mux := http.NewServeMux()

	// Đăng ký route
	mux.HandleFunc("/", handleHome)

	return mux
}

// Logic xử lý (Handler) nằm gọn trong package này
func handleHome(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Hello World from Router Package!")
}