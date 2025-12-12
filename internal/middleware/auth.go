package middleware

import (
	"context"
	"golang/internal/logger"
	"golang/internal/model"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)


// AdminOnlyMiddleware: Chỉ cho phép Admin truy cập
func AdminOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		//  Lấy token từ Header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Thiếu token xác thực", http.StatusUnauthorized)
			return
		}

		// Cắt bỏ chữ "Bearer " để lấy token thuần
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse và Validate Token
		claims := &model.MyClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			logger.ErrorLogger.Printf("Token không hợp lệ: %v", err)
			http.Error(w, "Token không hợp lệ hoặc đã hết hạn", http.StatusUnauthorized)
			return
		}

		//  KIỂM TRA ROLE
		if claims.Role != "admin" {
			logger.WarnLogger.Printf("User ID %d cố tình truy cập quyền Admin", claims.UserID)
			http.Error(w, "Bạn không có quyền thực hiện chức năng này (Admin only)", http.StatusForbidden)
			return
		}

		// Lưu UserID vào Context để Controller bên trong có thể dùng
		// Ví dụ: Controller muốn biết ai là người tạo tài khoản này
		ctx := context.WithValue(r.Context(), "userID", claims.UserID)

		// Cho phép đi tiếp vào Controller
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// AuthMiddleware: Xác thực người dùng bằng JWT Token
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Lấy token từ Header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Thiếu token xác thực", http.StatusUnauthorized)
			return
		}

		// Cắt chuỗi "Bearer "
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse Token
		claims := &model.MyClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Token không hợp lệ", http.StatusUnauthorized)
			return
		}

		// Token hợp lệ -> Lưu UserID vào Context và cho đi tiếp
		ctx := context.WithValue(r.Context(), "userID", claims.UserID)
		ctx = context.WithValue(ctx, "userRole", claims.Role) // Lưu thêm role nếu cần

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
