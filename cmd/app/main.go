package main

import (
	config "golang/internal/configs/database"
	"golang/internal/server"
	"log"
)

func main() {
	//Khoi tao database
	db := config.NewDatabaseConnection()
	if db == nil {
		log.Fatal("Lỗi khi kết nối database: kết quả là nil")
	}
	defer db.Connection.Close()
	log.Println("Kết nối database thành công")
	//Khoi tao server
	srv := server.NewServer()
	log.Println("Server đang chạy trên cổng 8081")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Lỗi khi chạy server: %v", err)
	}
}
