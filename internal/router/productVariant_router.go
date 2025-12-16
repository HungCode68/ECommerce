package router

import (
	"golang/internal/handler"
	"net/http"
)

func ProductVariantRouter(mux *http.ServeMux,h *handler.VariantHandler){
	mux.HandleFunc("POST /admin/product/{id}/variant",h.CreateVariantHandler)
}