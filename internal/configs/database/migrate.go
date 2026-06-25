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

	// Đảm bảo cột reason tồn tại trong trường hợp bảng đã được tạo từ trước
	_, err = db.Exec("ALTER TABLE callback_requests ADD COLUMN reason TEXT AFTER phone_number;")
	if err == nil {
		log.Println("Database: Đã thêm cột 'reason' vào bảng callback_requests")
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

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS admin_audit_logs (
			id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
			admin_id INT NOT NULL,
			action VARCHAR(50) NOT NULL,
			entity_type VARCHAR(50) NOT NULL,
			entity_id VARCHAR(50) DEFAULT NULL,
			old_values LONGTEXT,
			new_values LONGTEXT,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`)
	if err != nil {
		log.Printf("Cảnh báo: Không thể tạo bảng admin_audit_logs: %v", err)
	} else {
		log.Println("Database: Bảng admin_audit_logs đã sẵn sàng")
	}
}
