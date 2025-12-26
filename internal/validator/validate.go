package validator

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

// 1. Tạo biến toàn cục (private) để lưu instance của thư viện gốc
var validate *validator.Validate

var badWordList = []string{
	"abc",
	"fake",
	"scam",
	"fraud",
	"spam",
}

// CustomValidator struct (nếu cần thêm phương thức khác, có thể thêm vào đây)

// 2. Hàm init() sẽ tự động chạy khi chương trình bắt đầu
func init() {
	validate = validator.New()
	// Đăng ký hàm validate tùy chỉnh cho từ ngữ không phù hợp
	validate.RegisterValidation("badwords", containsBadWords)
}
func containsBadWords(fl validator.FieldLevel) bool {
	text := fl.Field().String()
	textLower := strings.ToLower(text)

	for _, word := range badWordList {
		if strings.Contains(textLower, word) {
			return false // Trả về false nghĩa là Vi phạm (Lỗi)
		}
	}
	return true // Trả về true nghĩa là Hợp lệ

}

// 3. Hàm Validate công khai (Global Function) - Không cần receiver (cv *CustomValidator) nữa
func Validate(data interface{}) map[string]string {
	// Gọi biến toàn cục validate
	err := validate.Struct(data)

	if err == nil {
		return nil
	}

	validationErrors := err.(validator.ValidationErrors)
	errors := make(map[string]string)

	for _, fieldError := range validationErrors {
		errors[fieldError.Field()] = getErrorMessage(fieldError)
	}

	return errors
}

// Hàm helper giữ nguyên
func getErrorMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "Trường này không được để trống"
	case "email":
		return "Định dạng email không hợp lệ"
	case "min":
		return fmt.Sprintf("Độ dài tối thiểu phải là %s ký tự", fe.Param())
	case "max":
		return fmt.Sprintf("Độ dài tối đa chỉ được %s ký tự", fe.Param())
	case "alphanum":
		return "Chỉ được chứa chữ cái và số (không ký tự đặc biệt)"
	case "oneof":
		return fmt.Sprintf("Giá trị phải là một trong các loại: %s", strings.ReplaceAll(fe.Param(), " ", ", "))
	case "gt":
		return fmt.Sprintf("Giá trị phải lớn hơn %s", fe.Param())
	case "badwords":
		return "Nội dung chứa từ ngữ không phù hợp"
	default:
		return fmt.Sprintf("Lỗi không xác định (%s)", fe.Tag())
	}
}
