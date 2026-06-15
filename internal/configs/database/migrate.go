package database

import (
	"database/sql"
	"log"
)

func Migrate(db *sql.DB) {
	// Auto migrate tables
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS callback_requests (
			id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
			phone_number VARCHAR(30) NOT NULL,
			reason TEXT,
			status VARCHAR(20) NOT NULL DEFAULT 'pending',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`)
	if err != nil {
		log.Printf("Cảnh báo: Không thể tạo bảng callback_requests: %v", err)
	} else {
		log.Println("Database: Bảng callback_requests đã sẵn sàng")
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS system_settings (
			` + "`key`" + ` VARCHAR(100) NOT NULL PRIMARY KEY,
			value TEXT NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`)
	if err != nil {
		log.Printf("Cảnh báo: Không thể tạo bảng system_settings: %v", err)
	} else {
		log.Println("Database: Bảng system_settings đã sẵn sàng")
	}
}
