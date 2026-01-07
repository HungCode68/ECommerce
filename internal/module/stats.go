package module

import (
	"database/sql"
	"net/http"

	statsController "golang/internal/controller/stats"
	"golang/internal/cron"
	statsHandler "golang/internal/handler/stats"
	statsRepo "golang/internal/repository/stats"
	"golang/internal/router"
)

// InitStatsModule: Hàm khởi tạo toàn bộ module thống kê
func InitStatsModule(db *sql.DB, mux *http.ServeMux) *cron.CronManager {
	// Khởi tạo Repository
	repo := statsRepo.NewStatsRepository(db)

	//  Khởi tạo Controller
	ctrl := statsController.NewStatsController(repo)

	//  Khởi tạo Handler
	hdl := statsHandler.NewStatsHandler(ctrl)

	//  Đăng ký Router
	router.NewStatsRouter(mux, hdl)

	// Khởi tạo Cron Manager
	cronManager := cron.NewCronManager(ctrl)

	return cronManager
}
