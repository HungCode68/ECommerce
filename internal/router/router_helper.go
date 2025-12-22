package router

import (
	"net/http"
)

//  Helper type định nghĩa Group
type routeGroup struct {
	mux        *http.ServeMux
	prefix     string
	middlewares []func(http.Handler) http.Handler
}

//  Hàm tạo Group mới
func newGroup(mux *http.ServeMux, prefix string, mws ...func(http.Handler) http.Handler) *routeGroup {
	return &routeGroup{
		mux:        mux,
		prefix:     prefix,
		middlewares: mws,
	}
}

// Hàm đăng ký route
func (g *routeGroup) HandleFunc(method string, path string, handlerFunc http.HandlerFunc) {
	// Kết hợp method, prefix và path để tạo full pattern
	fullPattern := method + " " + g.prefix + path

	var finalHandler http.Handler = handlerFunc
	
	// Áp dụng middleware theo thứ tự ngược lại
	// VD: middlewares = [mw1, mw2] => finalHandler = mw1(mw2(handlerFunc))
	for i := len(g.middlewares) - 1; i >= 0; i-- {
		finalHandler = g.middlewares[i](finalHandler)
	}

	g.mux.Handle(fullPattern, finalHandler)
}