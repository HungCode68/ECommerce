package module

import (
	"database/sql"
	productController "golang/internal/controller/product"
	producthistoryController "golang/internal/controller/producthistory"
	productReviewsController "golang/internal/controller/productreviews"
	productVariantController "golang/internal/controller/productvariant"
	productHandler "golang/internal/handler/product"
	productHistoryHandler "golang/internal/handler/producthistory"
	productReviewHandler "golang/internal/handler/productreview"
	productVariantHandler "golang/internal/handler/productvariant"
	order "golang/internal/repository/order"
	product "golang/internal/repository/product"
	producthistory "golang/internal/repository/producthistory"
	productreview "golang/internal/repository/productreview"
	productVariant "golang/internal/repository/productvariant"
	"golang/internal/router"
	"net/http"
)

func InitProductModule(db *sql.DB, mux *http.ServeMux) {
	// khởi tạo repo
	repoProduct := product.NewProductRepo(db)
	repoVariant := productVariant.NewVariantRepo(db)
	repoHistory := producthistory.NewProductHistoryRepo(db)
	repoReview := productreview.NewProductReviewRepo(db)
	orderRepo := order.NewOrderRepository(db)

	// khởi tạo Controller
	ctrlProduct := productController.NewProductController(repoProduct, repoVariant, repoHistory, repoReview)
	ctrlVariant := productVariantController.NewProductVariantController(repoVariant)
	ctrlHistory := producthistoryController.NewProductHistoryController(repoHistory)
	ctrlReview := productReviewsController.NewProductReviewsController(repoReview, orderRepo)
	// khởi tạo Handler
	hdlProduct := productHandler.NewProductHandler(ctrlProduct)
	hdlVariant := productVariantHandler.NewVariantHandler(ctrlVariant)
	hdlHistory := productHistoryHandler.NewProductHistoryHandler(ctrlHistory)
	hdlReview := productReviewHandler.NewProductReviewHandler(ctrlReview)
	// đăng ký Router
	router.NewProductRouter(mux, hdlProduct)
	router.NewProductVariantRouter(mux, hdlVariant)
	router.NewProductHistoryRouter(mux, hdlHistory)
	router.NewProductReviewRouter(mux, hdlReview)
}
