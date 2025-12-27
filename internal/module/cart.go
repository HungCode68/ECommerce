package module

import (
	"database/sql"
	"net/http"

	cartCtrl "golang/internal/controller/cart"
	cartHdl "golang/internal/handler/cart"

	cartRepo "golang/internal/repository/cart"
	productRepo "golang/internal/repository/product"
	variantRepo "golang/internal/repository/productVariant"

	"golang/internal/router"
)

func InitCartModule(db *sql.DB, mux *http.ServeMux) {
	//  Khởi tạo Repository
	repositoryCart := cartRepo.NewCartRepository(db)

	repositoryProduct := productRepo.NewProductRepo(db)
	repositoryVariant := variantRepo.NewVariantRepo(db)

	controllerCart := cartCtrl.NewCartController(repositoryCart, repositoryProduct, repositoryVariant)

	handlerCart := cartHdl.NewCartHandler(controllerCart)

	//  Đăng ký Router
	router.NewCartRouter(mux, handlerCart)
}