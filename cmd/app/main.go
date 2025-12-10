package main

import (
	config "golang/internal/configs/database"
	"golang/internal/controller"
	"golang/internal/handler"
	"golang/internal/repository"
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

	productRepo := repository.NewProductRepo(db.Connection)

	productController := controller.NewProductController(productRepo)

	productHandler := handler.NewProductHandler(productController)

	srv := server.NewServer(productHandler)
	log.Println("Starting server on :8081")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Lỗi khi khởi động server: %v", err)
	}
}
