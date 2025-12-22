package module

import (
	"database/sql"
	userController "golang/internal/controller/user"
	userHandler "golang/internal/handler/user"
	"golang/internal/repository/user"
	"golang/internal/router"
	"net/http"
)

// InitUserModule
func InitUserModule(db *sql.DB, mux *http.ServeMux) {

	// Khởi tạo các tầng
	repo := user.NewUserDb(db)
	ctrl := userController.NewUserController(repo)
	hdl := userHandler.NewUserHandler(ctrl)

	// Đăng ký router User
	router.NewUserRouter(mux, hdl)
}
