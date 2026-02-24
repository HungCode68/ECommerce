package middleware

import (
	"context"
	"fmt"
	"golang/internal/logger"
	"golang/internal/model"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/golang-jwt/jwt/v5"
)

// ContextKey - Type-safe context key để tránh collision
type ContextKey string

const (
	UserIDKey   ContextKey = "userID"
	UserRoleKey ContextKey = "userRole"
)

// Cached JWT Secret để tránh gọi os.Getenv mỗi request
var (
	jwtSecret     []byte
	jwtSecretOnce sync.Once
)

// getJWTSecret - Lấy JWT secret (cached)
func getJWTSecret() []byte {
	jwtSecretOnce.Do(func() {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			logger.ErrorLogger.Fatal("CRITICAL: JWT_SECRET is not set in environment")
		}
		if len(secret) < 32 {
			logger.WarnLogger.Println("WARNING: JWT_SECRET should be at least 32 characters")
		}
		jwtSecret = []byte(secret)
	})
	return jwtSecret
}

// parseAndValidateToken - Helper function để parse và validate JWT token
func parseAndValidateToken(tokenString string) (*model.MyClaims, error) {
	claims := &model.MyClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method để tránh Algorithm Confusion Attack
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// AdminOnlyMiddleware: Chỉ cho phép Admin truy cập
func AdminOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Lấy token từ Header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Thiếu token xác thực", http.StatusUnauthorized)
			return
		}

		// Cắt bỏ chữ "Bearer " để lấy token thuần
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			http.Error(w, "Token format không hợp lệ", http.StatusUnauthorized)
			return
		}

		// Parse và Validate Token
		claims, err := parseAndValidateToken(tokenString)
		if err != nil {
			logger.ErrorLogger.Printf("Token không hợp lệ: %v", err)
			http.Error(w, "Token không hợp lệ hoặc đã hết hạn", http.StatusUnauthorized)
			return
		}

		// KIỂM TRA ROLE
		if claims.Role != "admin" {
			logger.WarnLogger.Printf("User ID %d cố tình truy cập quyền Admin", claims.UserID)
			http.Error(w, "Bạn không có quyền thực hiện chức năng này (Admin only)", http.StatusForbidden)
			return
		}

		// Lưu UserID vào Context với typed key
		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, UserRoleKey, claims.Role)

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
		if tokenString == authHeader {
			http.Error(w, "Token format không hợp lệ", http.StatusUnauthorized)
			return
		}

		// Parse Token với algorithm verification
		claims, err := parseAndValidateToken(tokenString)
		if err != nil {
			logger.ErrorLogger.Printf("Token không hợp lệ: %v", err)
			http.Error(w, "Token không hợp lệ", http.StatusUnauthorized)
			return
		}

		// Token hợp lệ -> Lưu UserID vào Context với typed key
		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, UserRoleKey, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserIDFromContext - Helper để lấy UserID từ context một cách an toàn
func GetUserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(UserIDKey).(int64)
	return userID, ok
}

// GetUserRoleFromContext - Helper để lấy Role từ context
func GetUserRoleFromContext(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(UserRoleKey).(string)
	return role, ok
}
