package main

import (
	config "golang/internal/configs/database"
	"golang/internal/logger"
	"golang/internal/module"
	"golang/internal/server"
	"log"
	"net/http"
)

func main() {
	logger.InitLogger()
	//Khoi tao database
	db := config.NewDatabaseConnection()
	if db == nil {
		log.Fatal("Lỗi khi kết nối database: kết quả là nil")
	}
	defer db.Connection.Close()
	log.Println("Kết nối database thành công")

	mux := http.NewServeMux()

	// KHỞI TẠO CÁC MODULE
	module.InitUserModule(db.Connection, mux)

	module.InitAddressModule(db.Connection, mux)

	module.InitProductModule(db.Connection, mux)

	module.InitCategoryModule(db.Connection, mux)

	module.InitCartModule(db.Connection, mux)

	module.InitOrderModule(db.Connection, mux)

	// Chạy Server
	srv := server.NewServer(mux)

	log.Println("Server starting on :8081")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)

	}
}
