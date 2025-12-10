package main

import (
	config "golang/internal/configs/database"
	"golang/internal/controller"
	"golang/internal/handler"
	"golang/internal/repository"
	"golang/internal/server"
	"golang/internal/controller"
	"golang/internal/handler"
	"golang/internal/logger"
	"golang/internal/repository"
	"golang/internal/router"
	"golang/internal/validator"
	"log"
)

func main() {
<<<<<<< HEAD
	logger.InitLogger()
=======

>>>>>>> df8a219 (up)
	//Khoi tao database
	db := config.NewDatabaseConnection()
	if db == nil {
		log.Fatal("Lỗi khi kết nối database: kết quả là nil")
	}
	defer db.Connection.Close()
	log.Println("Kết nối database thành công")

<<<<<<< HEAD
	myValidator := validator.NewCustomValidator()

	// Khởi tạo Repository, Controller, Handler cho User 
	userRepo := repository.NewUserDb(db.Connection)
	userController := controller.NewUserController(userRepo)
	userHandler := handler.NewUserHandler(userController, myValidator)

	// Khởi tạo Repository, Controller, Handler cho Address
	addressRepo := repository.NewAddressDb(db.Connection)
	addressController := controller.NewAddressController(addressRepo)
	addressHandler := handler.NewAddressHandler(addressController, myValidator)

	// Khởi tạo Router
	r := router.NewRouter(userHandler, addressHandler)

	//Khởi tạo Server (Truyền router r vào)
	srv := server.NewServer(r)

	log.Println("Server starting on :8081")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
=======
	productRepo := repository.NewProductRepo(db.Connection)

	productController := controller.NewProductController(productRepo)

	productHandler := handler.NewProductHandler(productController)

	srv := server.NewServer(productHandler)
	log.Println("Starting server on :8081")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Lỗi khi khởi động server: %v", err)
>>>>>>> df8a219 (up)
	}
}
