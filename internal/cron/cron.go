package cron

import (
	"context"
	"fmt"

	"github.com/robfig/cron/v3"
	
	statsController "golang/internal/controller/stats"
	"golang/internal/logger"
)

type CronManager struct {
	StatsController statsController.StatsController
	cron            *cron.Cron
}

func NewCronManager(statsCtrl statsController.StatsController) *CronManager {
	return &CronManager{
		StatsController: statsCtrl,
		cron:            cron.New(),
	}
}

// Start: Đăng ký các Job và bắt đầu chạy
func (m *CronManager) Start() {
	// Job 1: Cập nhật thống kê doanh thu hàng ngày (00:30 sáng)
	_, err := m.cron.AddFunc("30 0 * * *", func() {
		logger.InfoLogger.Println("[CRON] Bắt đầu chạy Job Update Daily Stats...")
		
		ctx := context.Background()
		if err := m.StatsController.SyncDailyStats(ctx); err != nil {
			logger.ErrorLogger.Printf("[CRON] Lỗi cập nhật thống kê: %v", err)
		} else {
			logger.InfoLogger.Println("[CRON] Cập nhật thống kê thành công!")
		}
	})

	if err != nil {
		fmt.Printf("Lỗi đăng ký Cron Job: %v\n", err)
	}

	// Bắt đầu chạy background
	m.cron.Start()
	logger.InfoLogger.Println("Cron Job Manager đã khởi động...")
}

// Stop: Dùng để dừng cron khi tắt server
func (m *CronManager) Stop() {
	if m.cron != nil {
		m.cron.Stop()
		logger.InfoLogger.Println("Cron Job Manager đã dừng.")
	}
}