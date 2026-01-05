// File: internal/utils/response.go
package utils

import (
	"encoding/json"
	"golang/internal/model"
	"net/http"
)

// writeJSON - Trả về response JSON thành công
func WriteJSON(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := model.APIResponse{
		Code:    statusCode,
		Message: message,
		Data:    data,
		Errors:  nil,
	}

	json.NewEncoder(w).Encode(response)
}

// writeError - Trả về response JSON lỗi
func WriteError(w http.ResponseWriter, statusCode int, message string, errors interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := model.APIResponse{
		Code:    statusCode,
		Message: message,
		Data:    nil,
		Errors:  errors,
	}

	json.NewEncoder(w).Encode(response)
}
