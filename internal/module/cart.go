package module

import (
	"database/sql"
	"net/http"

	cartCtrl "golang/internal/controller/cart"
	cartHdl "golang/internal/handler/cart"

	cartRepo "golang/internal/repository/cart"
	couponRepo "golang/internal/repository/coupons"
	productRepo "golang/internal/repository/product"
	variantRepo "golang/internal/repository/productvariant"
	userRepo "golang/internal/repository/user"

	"golang/internal/router"
)

func InitCartModule(db *sql.DB, mux *http.ServeMux) {
	//  Khởi tạo Repository
	repositoryCart := cartRepo.NewCartRepository(db)
	repositoryCoupon := couponRepo.NewCouponsRepository(db)

	repositoryProduct := productRepo.NewProductRepo(db)
	repositoryVariant := variantRepo.NewVariantRepo(db)
	repositoryUser := userRepo.NewUserDb(db)

	controllerCart := cartCtrl.NewCartController(repositoryCart, repositoryCoupon, repositoryProduct, repositoryVariant)

	handlerCart := cartHdl.NewCartHandler(controllerCart, repositoryUser)

	//  Đăng ký Router
	router.NewCartRouter(mux, handlerCart)
}
