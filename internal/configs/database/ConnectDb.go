package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	_ "github.com/microsoft/go-mssqldb"
)

type DBConfig struct {
	Connection *sql.DB
}

func NewDatabaseConnection() *DBConfig {
	if err := godotenv.Load("internal/configs/.env"); err != nil {
		log.Fatalf("Lỗi trong file .env: %v", err)
	}

	driver := os.Getenv("DB_DRIVER_FORCE")
	
	// Nếu không có force, mới lấy DB_DRIVER mặc định
	if driver == "" {
		driver = os.Getenv("DB_DRIVER")
	}

	if driver == "" {
		log.Fatal("Chưa cấu hình DB_DRIVER hoặc DB_DRIVER_FORCE trong .env")
	}

	var connStr string
	var db *sql.DB
	var err error

	// Xây dựng connection string dựa trên driver
	switch driver {
	case "mysql":
		// MySQL connection string format: user:password@tcp(host:port)/dbname
		connStr = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=Local",
			os.Getenv("DB_USER_MYSQL"),
			os.Getenv("DB_PASSWORD_MYSQL"),
			os.Getenv("DB_HOST_MYSQL"),
			os.Getenv("DB_PORT_MYSQL"),
			os.Getenv("DB_NAME"),
		)
		db, err = sql.Open("mysql", connStr)
	case "sqlserver":
		// SQL Server connection string format: sqlserver://user:password@host:port?database=dbname
		connStr = fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=%s",
			os.Getenv("DB_USER_SQLSERVER"),
			os.Getenv("DB_PASSWORD_SQLSERVER"),
			os.Getenv("DB_HOST_SQLSERVER"),
			os.Getenv("DB_PORT_SQLSERVER"),
			os.Getenv("DB_NAME"),
		)
		db, err = sql.Open("sqlserver", connStr)
	default:
		log.Fatalf("Driver không được hỗ trợ: %s. Chỉ hỗ trợ 'mysql' hoặc 'sqlserver'", driver)
	}

	if err != nil {
		log.Fatalf("Lỗi khi mở kết nối database: %v", err)
	}

	// Kiểm tra kết nối
	if err := db.Ping(); err != nil {
		log.Fatalf("Lỗi khi ping database: %v", err)
	}

	log.Printf("Kết nối %s database thành công!", driver)

	return &DBConfig{
		Connection: db,
	}
}

// Close đóng kết nối database
func (config *DBConfig) Close() error {
	if config.Connection != nil {
		return config.Connection.Close()
	}
	return nil
}