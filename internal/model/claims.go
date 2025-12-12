package model

import "github.com/golang-jwt/jwt/v5"


type MyClaims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}