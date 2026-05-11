package productreview

import (
	"bytes"
	"crypto/sha1"
	"encoding/json"
	"encoding/hex"
	"fmt"
	"golang/internal/controller/productreviews"
	"golang/internal/logger"
	"golang/internal/middleware"
	"golang/internal/model"
	"golang/internal/validator"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

type productReviewHandler struct {
	controller productreviews.ProductReviewsController
}

func NewProductReviewHandler(ctrl productreviews.ProductReviewsController) ProductReviewHandler {
	return &productReviewHandler{controller: ctrl}
}

func (h *productReviewHandler) writeJson(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *productReviewHandler) errJson(w http.ResponseWriter, status int, message string) {
	h.writeJson(w, status, map[string]string{"error": message})
}

// CreateReviewHandler handles posting a review for a product
func (h *productReviewHandler) CreateReviewHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)
	if err != nil || productID <= 0 {
		h.errJson(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	// userID is stored by AuthMiddleware
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		h.errJson(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req model.CreateProductReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errJson(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := validator.Validate(req); err != nil {
		h.errJson(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	resp, err := h.controller.CreateReview(r.Context(), req, productID, userID)
	if err != nil {
		logger.ErrorLogger.Printf("CreateReviewHandler error (productID=%d, userID=%d): %v", productID, userID, err)
		h.errJson(w, http.StatusInternalServerError, "Cannot create review")
		return
	}

	h.writeJson(w, http.StatusCreated, resp)
}

// ListReviewsHandler returns all reviews for a product along with summary
func (h *productReviewHandler) ListReviewsHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)
	if err != nil || productID <= 0 {
		h.errJson(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	resp, err := h.controller.ListReviews(productID)
	if err != nil {
		logger.ErrorLogger.Printf("ListReviewsHandler error (productID=%d): %v", productID, err)
		h.errJson(w, http.StatusInternalServerError, "Cannot load reviews")
		return
	}

	h.writeJson(w, http.StatusOK, resp)
}

// DeleteReviewHandler deletes a review by ID (admin or owner can be enforced upstream)
func (h *productReviewHandler) DeleteReviewHandler(w http.ResponseWriter, r *http.Request) {
	reviewIDStr := r.PathValue("reviewId")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil || reviewID <= 0 {
		h.errJson(w, http.StatusBadRequest, "Invalid review ID")
		return
	}

	resp, err := h.controller.DeleteReview(reviewID)
	if err != nil {
		logger.ErrorLogger.Printf("DeleteReviewHandler error (reviewID=%d): %v", reviewID, err)
		h.errJson(w, http.StatusInternalServerError, "Cannot delete review")
		return
	}

	h.writeJson(w, http.StatusOK, resp)
}

func buildReviewCloudinarySignature(params map[string]string, apiSecret string) string {
	keys := make([]string, 0, len(params))
	for key, value := range params {
		if value == "" {
			continue
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, fmt.Sprintf("%s=%s", key, params[key]))
	}

	hash := sha1.Sum([]byte(strings.Join(parts, "&") + apiSecret))
	return hex.EncodeToString(hash[:])
}

func uploadReviewImageToCloudinary(file multipart.File, filename string) (string, error) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")
	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return "", fmt.Errorf("missing cloudinary env config")
	}

	folder := os.Getenv("CLOUDINARY_REVIEW_UPLOAD_FOLDER")
	if folder == "" {
		folder = "ecommerce/reviews"
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	signature := buildReviewCloudinarySignature(map[string]string{
		"folder":    folder,
		"timestamp": timestamp,
	}, apiSecret)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	if err := writer.WriteField("api_key", apiKey); err != nil {
		return "", err
	}
	if err := writer.WriteField("timestamp", timestamp); err != nil {
		return "", err
	}
	if err := writer.WriteField("folder", folder); err != nil {
		return "", err
	}
	if err := writer.WriteField("signature", signature); err != nil {
		return "", err
	}

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(part, file); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", cloudName), body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var cloudinaryResp struct {
		SecureURL string `json:"secure_url"`
		Error     *struct {
			Message string `json:"message"`
		} `json:"error,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&cloudinaryResp); err != nil {
		return "", err
	}

	if resp.StatusCode >= 400 {
		if cloudinaryResp.Error != nil && cloudinaryResp.Error.Message != "" {
			return "", fmt.Errorf(cloudinaryResp.Error.Message)
		}
		return "", fmt.Errorf("cloudinary upload failed with status %d", resp.StatusCode)
	}

	if cloudinaryResp.SecureURL == "" {
		return "", fmt.Errorf("cloudinary did not return secure_url")
	}

	return cloudinaryResp.SecureURL, nil
}

func (h *productReviewHandler) UploadReviewImageHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		h.errJson(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		h.errJson(w, http.StatusBadRequest, "Missing 'image' in form-data")
		return
	}
	defer file.Close()

	imageURL, err := uploadReviewImageToCloudinary(file, header.Filename)
	if err != nil {
		logger.ErrorLogger.Printf("UploadReviewImageHandler error: %v", err)
		h.errJson(w, http.StatusInternalServerError, "Failed to upload review image")
		return
	}

	h.writeJson(w, http.StatusOK, map[string]any{
		"code":    http.StatusOK,
		"message": "Upload review image successfully",
		"data": map[string]string{
			"url": imageURL,
		},
	})
}
