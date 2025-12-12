package logger

import (
	"log"
	"os"
)

var (
	TraceLogger *log.Logger
	DebugLogger *log.Logger
	InfoLogger  *log.Logger
	WarnLogger  *log.Logger
	ErrorLogger *log.Logger
	FatalLogger *log.Logger
)

func InitLogger() {
	// 1. Mở MỘT file duy nhất cho tất cả các level log
	file, err := os.OpenFile("internal/logs/server.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Không thể mở file log: %v", err)
	}

	// Cờ (Flag) định dạng log chuẩn
	logFlags := log.Ldate | log.Ltime | log.Lshortfile

	// 2. Khởi tạo tất cả logger cùng trỏ vào biến 'file'
	TraceLogger = log.New(file, "TRACE: ", logFlags)
	DebugLogger = log.New(file, "DEBUG: ", logFlags)
	InfoLogger = log.New(file, "INFO:  ", logFlags)
	WarnLogger = log.New(file, "WARN:  ", logFlags)
	ErrorLogger = log.New(file, "ERROR: ", logFlags)
	FatalLogger = log.New(file, "FATAL: ", logFlags)
}
