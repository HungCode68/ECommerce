package router

import (
	"golang/internal/handler"
	"net/http"
)

func ProductVariantRouter(mux *http.ServeMux, h *handler.VariantHandler) {
	mux.HandleFunc("POST /admin/product/{id}/variant", h.CreateVariantHandler)
	mux.HandleFunc("PUT /admin/product/{id}/variant/{variantId}", h.UpdateVariantHandler)
	mux.HandleFunc("DELETE /admin/product/{id}/variant/{variantId}", h.DeleteVariantHandler)
}
