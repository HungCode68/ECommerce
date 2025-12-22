package module

import (
	"database/sql"
	categoryController "golang/internal/controller/category"
	categoryHandler "golang/internal/handler/category"
	"golang/internal/repository/category"
	"golang/internal/router"
	"net/http"
)

// InitCategoryModule - Khởi tạo module Category
func InitCategoryModule(db *sql.DB, mux *http.ServeMux) {

	// Khởi tạo Repository
	repo := category.NewCategoryDb(db)

	// Khởi tạo Controller
	ctrl := categoryController.NewCategoryController(repo)

	//  Khởi tạo Handler (Cần Validator)
	hdl := categoryHandler.NewCategoryHandler(ctrl)

	//  Đăng ký Router
	router.NewCategoryRouter(mux, hdl)
}
