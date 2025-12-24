package module

import (
	"database/sql"
	productController "golang/internal/controller/product"
	producthistoryController "golang/internal/controller/producthistory"
	productVariantController "golang/internal/controller/productvariant"
	productHandler "golang/internal/handler/product"
	productHistoryHandler "golang/internal/handler/producthistory"
	productVariantHandler "golang/internal/handler/productvariant"
	product "golang/internal/repository/product"
	producthistory "golang/internal/repository/producthistory"
	productVariant "golang/internal/repository/productvariant"
	"golang/internal/router"
	"net/http"
)

func InitProductModule(db *sql.DB, mux *http.ServeMux) {
	// khởi tạo repo
	repoProduct := product.NewProductRepo(db)
	repoVariant := productVariant.NewVariantRepo(db)
	repoHistory := producthistory.NewProductHistoryRepo(db)

	// khởi tạo Controller
	ctrlProduct := productController.NewProductController(repoProduct, repoVariant, repoHistory)
	ctrlVariant := productVariantController.NewProductVariantController(repoVariant)
	ctrlHistory := producthistoryController.NewProductHistoryController(repoHistory)
	// khởi tạo Handler
	hdlProduct := productHandler.NewProductHandler(ctrlProduct)
	hdlVariant := productVariantHandler.NewVariantHandler(ctrlVariant)
	hdlHistory := productHistoryHandler.NewProductHistoryHandler(ctrlHistory)
	// đăng ký Router
	router.NewProductRouter(mux, hdlProduct)
	router.NewProductVariantRouter(mux, hdlVariant)
	router.NewProductHistoryRouter(mux, hdlHistory)
}
