package main

import (
	"context"
	config "golang/internal/configs/database"
	"golang/internal/logger"
	"golang/internal/middleware"
	"golang/internal/module"
	"golang/internal/server"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	logger.InitLogger()
	//Khoi tao database
	db := config.NewDatabaseConnection()
	if db == nil {
		log.Fatal("Lỗi khi kết nối database: kết quả là nil")
	}
	log.Println("Kết nối database thành công")

	mux := http.NewServeMux()

	// KHỞI TẠO CÁC MODULE
	module.InitUserModule(db.Connection, mux)

	module.InitAddressModule(db.Connection, mux)

	module.InitProductModule(db.Connection, mux)

	module.InitCategoryModule(db.Connection, mux)

	module.InitBannerModule(db.Connection, mux)

	module.InitCartModule(db.Connection, mux)

	module.InitOrderModule(db.Connection, mux)

	module.InitCouponsModule(db.Connection, mux)

	cronManager := module.InitStatsModule(db.Connection, mux)

	// Kích hoạt Cron Job chạy ngầm
	cronManager.Start()

	// Chạy Server
	srv := server.NewServer(middleware.CORS(mux))

	// Goroutine chạy server
	go func() {
		log.Println("Server starting on :8081")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful Shutdown: Đợi tín hiệu SIGINT hoặc SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Nhận tín hiệu shutdown, đang tắt server...")

	// Tạo context với timeout 30s để cho phép các request đang xử lý hoàn thành
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Tắt Cron Manager
	cronManager.Stop()
	log.Println("Cron Manager đã dừng")

	// Shutdown HTTP server gracefully
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Lỗi khi shutdown server: %v", err)
	}

	// Đóng database connection
	if err := db.Close(); err != nil {
		log.Printf("Lỗi khi đóng database: %v", err)
	}

	log.Println("Server đã tắt thành công!")
}
