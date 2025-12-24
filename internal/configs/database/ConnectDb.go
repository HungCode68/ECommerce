package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

type DBConfig struct {
	Connection *sql.DB
}

func NewDatabaseConnection() *DBConfig {
	//  Load file .env
	if err := godotenv.Load("./.env"); err != nil {
		log.Fatalf("Lỗi trong file .env: %v", err)
	}

	var err error

	// Cấu hình Connection String cho MySQL
	// Format: user:password@tcp(host:port)/dbname?parseTime=true&loc=Local
	connStr := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=Local",
		os.Getenv("DB_USER_MYSQL"),
		os.Getenv("DB_PASSWORD_MYSQL"),
		os.Getenv("DB_HOST_MYSQL"),
		os.Getenv("DB_PORT_MYSQL"),
		os.Getenv("DB_NAME"),
	)

	//  Mở kết nối
	db, err := sql.Open("mysql", connStr)
	if err != nil {
		log.Fatalf("Lỗi khi mở kết nối database: %v", err)
	}

	// Ping để kiểm tra kết nối thực tế
	if err := db.Ping(); err != nil {
		log.Fatalf("Lỗi khi ping database (MySQL): %v", err)
	}

	log.Println("Kết nối MySQL database thành công!")

	return &DBConfig{
		Connection: db,
	}
}

// Close: Đóng kết nối database
func (config *DBConfig) Close() error {
	if config.Connection != nil {
		return config.Connection.Close()
	}
	return nil
}
