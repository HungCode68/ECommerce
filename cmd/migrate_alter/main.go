package main

import (
	"log"
	config "golang/internal/configs/database"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	db := config.NewDatabaseConnection()
	if db == nil || db.Connection == nil {
		log.Fatal("Lỗi: Không thể kết nối database")
	}
	defer db.Connection.Close()

	_, err := db.Connection.Exec("ALTER TABLE callback_requests ADD COLUMN reason TEXT AFTER phone_number;")
	if err != nil {
		log.Println("Cảnh báo (có thể cột đã tồn tại):", err)
	} else {
		log.Println("Thêm cột reason thành công!")
	}
}
