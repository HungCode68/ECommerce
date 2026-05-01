package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

type DBConfig struct {
	Connection *sql.DB
}

// Connection pool defaults
const (
	defaultMaxOpenConns    = 25
	defaultMaxIdleConns    = 5
	defaultConnMaxLifetime = 5 * time.Minute
	defaultConnMaxIdleTime = 2 * time.Minute
)

func NewDatabaseConnection() *DBConfig {
	// Load file .env
	if err := godotenv.Load("./.env"); err != nil {
		log.Fatalf("Lỗi trong file .env: %v", err)
	}

	var err error

	dbParams := os.Getenv("DB_PARAMS")
	if dbParams == "" {
		dbParams = "parseTime=true&loc=Local"
	}

	// Cấu hình Connection String cho MySQL
	// Format: user:password@tcp(host:port)/dbname?parseTime=true&loc=Local
	connStr := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?%s",
		os.Getenv("DB_USER_MYSQL"),
		os.Getenv("DB_PASSWORD_MYSQL"),
		os.Getenv("DB_HOST_MYSQL"),
		os.Getenv("DB_PORT_MYSQL"),
		os.Getenv("DB_NAME"),
		dbParams,
	)

	// Mở kết nối
	db, err := sql.Open("mysql", connStr)
	if err != nil {
		log.Fatalf("Lỗi khi mở kết nối database: %v", err)
	}

	// Cấu hình Connection Pool
	maxOpenConns := getEnvAsInt("DB_MAX_OPEN_CONNS", defaultMaxOpenConns)
	maxIdleConns := getEnvAsInt("DB_MAX_IDLE_CONNS", defaultMaxIdleConns)
	connMaxLifetimeMins := getEnvAsInt("DB_CONN_MAX_LIFETIME_MINS", 5)
	connMaxIdleTimeMins := getEnvAsInt("DB_CONN_MAX_IDLE_TIME_MINS", 2)

	db.SetMaxOpenConns(maxOpenConns)
	db.SetMaxIdleConns(maxIdleConns)
	db.SetConnMaxLifetime(time.Duration(connMaxLifetimeMins) * time.Minute)
	db.SetConnMaxIdleTime(time.Duration(connMaxIdleTimeMins) * time.Minute)

	// Ping để kiểm tra kết nối thực tế
	if err := db.Ping(); err != nil {
		log.Fatalf("Lỗi khi ping database (MySQL): %v", err)
	}
	return &DBConfig{
		Connection: db,
	}
}

// getEnvAsInt - Helper để lấy env var dưới dạng int với default value
func getEnvAsInt(key string, defaultVal int) int {
	valStr := os.Getenv(key)
	if valStr == "" {
		return defaultVal
	}
	val, err := strconv.Atoi(valStr)
	if err != nil {
		return defaultVal
	}
	return val
}

// Close: Đóng kết nối database
func (config *DBConfig) Close() error {
	if config.Connection != nil {
		return config.Connection.Close()
	}
	return nil
}

// HealthCheck: Kiểm tra database còn hoạt động không
func (config *DBConfig) HealthCheck() error {
	if config.Connection == nil {
		return fmt.Errorf("database connection is nil")
	}
	return config.Connection.Ping()
}
