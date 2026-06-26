package productreview

import (
	"bytes"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"golang/internal/controller/productreviews"
	"golang/internal/logger"
	"golang/internal/middleware"
	"golang/internal/model"
	"golang/internal/utils"
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

// CreateReviewHandler handles posting a review for a product
func (h *productReviewHandler) CreateReviewHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)
	if err != nil || productID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid product ID", nil)
		return
	}

	// userID is stored by AuthMiddleware
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var req model.CreateProductReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if errs := validator.Validate(req); errs != nil {
		// Try to extract the exact error message from badwords if it exists
		errMsg := "Dữ liệu không hợp lệ"
		if badWordErr, ok := errs["Body"]; ok {
			errMsg = badWordErr
		}
		utils.WriteError(w, http.StatusBadRequest, errMsg, errs)
		return
	}

	resp, err := h.controller.CreateReview(r.Context(), req, productID, userID)
	if err != nil {
		logger.ErrorLogger.Printf("CreateReviewHandler error (productID=%d, userID=%d): %v", productID, userID, err)
		utils.WriteError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, "Thành công", resp)
}

// ListReviewsHandler returns all reviews for a product along with summary
func (h *productReviewHandler) ListReviewsHandler(w http.ResponseWriter, r *http.Request) {
	productIdStr := r.PathValue("id")
	productID, err := strconv.ParseInt(productIdStr, 10, 64)
	if err != nil || productID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid product ID", nil)
		return
	}

	resp, err := h.controller.ListReviews(productID)
	if err != nil {
		logger.ErrorLogger.Printf("ListReviewsHandler error (productID=%d): %v", productID, err)
		utils.WriteError(w, http.StatusInternalServerError, "Cannot load reviews", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", resp)
}

func (h *productReviewHandler) DeleteReviewHandler(w http.ResponseWriter, r *http.Request) {
	reviewIDStr := r.PathValue("reviewId")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil || reviewID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid review ID", nil)
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	resp, err := h.controller.DeleteReview(r.Context(), reviewID, userID)
	if err != nil {
		logger.ErrorLogger.Printf("DeleteReviewHandler error (reviewID=%d): %v", reviewID, err)
		utils.WriteError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", resp)
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
			return "", errors.New(cloudinaryResp.Error.Message)
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
		utils.WriteError(w, http.StatusBadRequest, "Failed to parse form data", nil)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Missing 'image' in form-data", nil)
		return
	}
	defer file.Close()

	imageURL, err := uploadReviewImageToCloudinary(file, header.Filename)
	if err != nil {
		logger.ErrorLogger.Printf("UploadReviewImageHandler error: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Failed to upload review image", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Upload review image successfully", map[string]string{
		"url": imageURL,
	})
}

func (h *productReviewHandler) GetUserReviewByOrderHandler(w http.ResponseWriter, r *http.Request) {
	productIDStr := r.PathValue("id")
	productID, _ := strconv.ParseInt(productIDStr, 10, 64)
	orderIDStr := r.PathValue("orderId")
	orderID, _ := strconv.ParseInt(orderIDStr, 10, 64)

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	resp, err := h.controller.GetUserReviewByOrder(r.Context(), orderID, productID, userID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", resp)
}

func (h *productReviewHandler) EditUserReviewHandler(w http.ResponseWriter, r *http.Request) {
	reviewIDStr := r.PathValue("reviewId")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil || reviewID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid review ID", nil)
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var req model.UpdateProductReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if errs := validator.Validate(req); errs != nil {
		errMsg := "Dữ liệu không hợp lệ"
		if badWordErr, ok := errs["Body"]; ok {
			errMsg = badWordErr
		}
		utils.WriteError(w, http.StatusBadRequest, errMsg, errs)
		return
	}

	resp, err := h.controller.EditUserReview(r.Context(), reviewID, req, userID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Sửa đánh giá thành công", resp)
}

func (h *productReviewHandler) AdminReplyToReviewHandler(w http.ResponseWriter, r *http.Request) {
	reviewIDStr := r.PathValue("reviewId")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil || reviewID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid review ID", nil)
		return
	}

	var req model.AdminReplyReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu không hợp lệ", errs)
		return
	}

	if err := h.controller.AdminReplyToReview(r.Context(), reviewID, req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Phản hồi đánh giá thành công", nil)
}

func (h *productReviewHandler) GetAllReviewsAdminHandler(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 10
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	offset := (page - 1) * limit

	reviews, total, err := h.controller.GetAllReviews(offset, limit)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Không thể lấy danh sách đánh giá", nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Thành công", map[string]interface{}{
		"data": reviews,
		"pagination": map[string]interface{}{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

func (h *productReviewHandler) AdminDeleteReviewHandler(w http.ResponseWriter, r *http.Request) {
	reviewIDStr := r.PathValue("reviewId")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil || reviewID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid review ID", nil)
		return
	}

	var req model.AdminDeleteReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu không hợp lệ", errs)
		return
	}

	if err := h.controller.AdminDeleteReview(r.Context(), reviewID, req.Reason); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Xóa đánh giá thành công", nil)
}
