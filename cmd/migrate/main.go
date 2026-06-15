package main

import (
	"log"
	config "golang/internal/configs/database"
	"github.com/joho/godotenv"
)

func main() {
	// Load biến môi trường từ .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Cảnh báo: Không thể load file .env (có thể bạn đã set biến môi trường ở OS)")
	}

	log.Println("Bắt đầu chạy migration...")

	// Khởi tạo connection
	db := config.NewDatabaseConnection()
	if db == nil || db.Connection == nil {
		log.Fatal("Lỗi: Không thể kết nối database")
	}
	defer db.Connection.Close()

	log.Println("Đã kết nối cơ sở dữ liệu thành công.")

	// Gọi hàm Migrate
	config.Migrate(db.Connection)

	log.Println("Chạy migration hoàn tất.")
}
