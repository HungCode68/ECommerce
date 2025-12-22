package module

import (
	"database/sql"
	productController "golang/internal/controller/product"
	productVariantController "golang/internal/controller/productVariant"
	productHandler "golang/internal/handler/product"
	productVariantHandler "golang/internal/handler/productVariant"
	product "golang/internal/repository/product"
	productVariant "golang/internal/repository/productVariant"
	"golang/internal/router"
	"net/http"
)

func InitProductModule(db *sql.DB, mux *http.ServeMux) {
	// khởi tạo repo
	repoProduct := product.NewProductRepo(db)
	repoVariant := productVariant.NewVariantRepo(db)

	// khởi tạo Controller
	ctrlProduct := productController.NewProductController(repoProduct, repoVariant)
	ctrlVariant := productVariantController.NewProductVariantController(repoVariant)

	// khởi tạo Handler
	hdlProduct := productHandler.NewProductHandler(ctrlProduct)
	hdlVariant := productVariantHandler.NewVariantHandler(ctrlVariant)

	// đăng ký Router 
	router.NewProductRouter(mux, hdlProduct)
	router.NewProductVariantRouter(mux, hdlVariant)
}