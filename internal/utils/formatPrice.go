package utils

import (
	"fmt"
)

// FormatVND
func FormatVND(amount float64) string {
	//  Chuyển về số nguyên 
	intAmount := int64(amount)

	//  Format có dấu phẩy 
	str := fmt.Sprintf("%d", intAmount)
	if intAmount < 1000 {
		return str + " ₫"
	}

	// Thêm dấu chấm
	var result []string
	count := 0
	for i := len(str) - 1; i >= 0; i-- {
		count++
		result = append(result, string(str[i]))
		if count%3 == 0 && i > 0 {
			result = append(result, ".") // Dùng dấu chấm cho tiền Việt
		}
	}

	// Đảo ngược chuỗi lại
	reversed := ""
	for i := len(result) - 1; i >= 0; i-- {
		reversed += result[i]
	}

	return reversed + " ₫"
}
