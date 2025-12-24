package producthistory

import (
	"encoding/json"
	"fmt"
	producthistory "golang/internal/controller/producthistory"
	"net/http"
	"strconv"
	"strings"
)

type productHistoryHandler struct {
	// Add necessary fields here, e.g., controller reference
	HistoryController producthistory.ProductHistoryController
}

func NewProductHistoryHandler(controller producthistory.ProductHistoryController) ProductHistoryHandler {
	return &productHistoryHandler{
		HistoryController: controller,
	}
}
func (h *productHistoryHandler) writeJson(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
func (h *productHistoryHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

func (ph *productHistoryHandler) GetProductHistoryByProductIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	idParts := strings.Split(idStr, ",")
	var productIDs []int64
	for _, part := range idParts {
		id, err := strconv.ParseInt(part, 10, 64)
		if err != nil {
			ph.errJson(w, http.StatusBadRequest, "Invalid product ID")
			return
		}
		productIDs = append(productIDs, id)
	}
	histories, err := ph.HistoryController.GetProductHistoryByProductIDController(productIDs)
	if err != nil {
		fmt.Printf("Loi %v", err)
		ph.errJson(w, http.StatusInternalServerError, "Failed to get product history")
		return
	}
	ph.writeJson(w, http.StatusOK, histories)
}

func (ph *productHistoryHandler) GetAllProductsHistoryHandler(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1
	}
	limitStr := r.URL.Query().Get("limit")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	histories, err := ph.HistoryController.GetAllProductsHistory(page, limit)
	if err != nil {
		ph.errJson(w, http.StatusInternalServerError, "Failed to get all products history")
		return
	}
	ph.writeJson(w, http.StatusOK, histories)
}

