package main

import (
	config "golang/internal/configs/database"
	"golang/internal/controller"
	"golang/internal/handler"
	"golang/internal/logger"
	"golang/internal/repository"
	"golang/internal/router"
	"golang/internal/server"
	"golang/internal/validator"
	"log"
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

	myValidator := validator.NewCustomValidator()

	// Khởi tạo Repository, Controller, Handler cho User
	userRepo := repository.NewUserDb(db.Connection)
	userController := controller.NewUserController(userRepo)
	userHandler := handler.NewUserHandler(userController, myValidator)

	// Khởi tạo Repository, Controller, Handler cho Address
	addressRepo := repository.NewAddressDb(db.Connection)
	addressController := controller.NewAddressController(addressRepo)
	addressHandler := handler.NewAddressHandler(addressController, myValidator)

	//Khoi tao cho product variant
	proVariantRepo := repository.NewVariantRepo(db.Connection)
	proVariantController := controller.NewProductVariantController(proVariantRepo)
	proVariantHandler := handler.NewVariantHandler(proVariantController)

	// Khởi tạo Repository, Controller, Handler cho Product
	productRepo := repository.NewProductRepo(db.Connection)
	productController := controller.NewProductController(productRepo, proVariantRepo)
	productHandler := handler.NewProductHandler(productController)

	// MODULE CATEGORY (Mới thêm vào)
	categoryRepo := repository.NewCategoryDb(db.Connection)
	categoryController := controller.NewCategoryController(categoryRepo)
	// Lưu ý: CategoryHandler cần validator để check dữ liệu đầu vào
	categoryHandler := handler.NewCategoryHandler(categoryController, myValidator)


	// Khởi tạo Router
	r := router.NewRouter(userHandler, addressHandler, productHandler, categoryHandler, proVariantHandler)

	//Khởi tạo Server (Truyền router r vào)
	srv := server.NewServer(r)

	log.Println("Server starting on :8081")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)

	}
}
