<<<<<<< HEAD
package validator

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

type CustomValidator struct {
	validate *validator.Validate
}

// NewCustomValidator: Hàm khởi tạo
func NewCustomValidator() *CustomValidator {
	return &CustomValidator{
		validate: validator.New(),
	}
}

// Validate: Hàm chính để kiểm tra lỗi
func (cv *CustomValidator) Validate(data interface{}) map[string]string {
	// Gọi thư viện gốc để check
	err := cv.validate.Struct(data)

	// Nếu không có lỗi (err == nil) thì trả về nil
	if err == nil {
		return nil
	}

	// Nếu có lỗi, chúng ta tạo map để chứa các thông báo lỗi đẹp
	validationErrors := err.(validator.ValidationErrors)
	errors := make(map[string]string)

	for _, fieldError := range validationErrors {

		errors[fieldError.Field()] = getErrorMessage(fieldError)
	}

	return errors
}

func getErrorMessage(fe validator.FieldError) string {
	// fe.Tag() trả về mã lỗi như: required, min, email...
	switch fe.Tag() {
	case "required":
		return "Trường này không được để trống"
	case "email":
		return "Định dạng email không hợp lệ"
	case "min":
		// fe.Param() lấy tham số phụ. VD: min=3 thì Param là 3
		return fmt.Sprintf("Độ dài tối thiểu phải là %s ký tự", fe.Param())
	case "max":
		return fmt.Sprintf("Độ dài tối đa chỉ được %s ký tự", fe.Param())
	case "alphanum":
		return "Chỉ được chứa chữ cái và số (không ký tự đặc biệt)"
	case "oneof":
		// Thay thế khoảng trắng bằng dấu phẩy cho đẹp. VD: "user admin" -> "user, admin"
		return fmt.Sprintf("Giá trị phải là một trong các loại: %s", strings.ReplaceAll(fe.Param(), " ", ", "))
	case "gt": // greater than
		return fmt.Sprintf("Giá trị phải lớn hơn %s", fe.Param())
	default:
		// Trường hợp lỗi lạ chưa định nghĩa
		return fmt.Sprintf("Lỗi không xác định (%s)", fe.Tag())
	}
}
=======
package validator

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

type CustomValidator struct {
	validate *validator.Validate
}

// NewCustomValidator: Hàm khởi tạo
func NewCustomValidator() *CustomValidator {
	return &CustomValidator{
		validate: validator.New(),
	}
}

// Validate: Hàm chính để kiểm tra lỗi
func (cv *CustomValidator) Validate(data interface{}) map[string]string {
	// Gọi thư viện gốc để check
	err := cv.validate.Struct(data)

	// Nếu không có lỗi (err == nil) thì trả về nil
	if err == nil {
		return nil
	}

	// Nếu có lỗi, chúng ta tạo map để chứa các thông báo lỗi đẹp
	validationErrors := err.(validator.ValidationErrors)
	errors := make(map[string]string)

	for _, fieldError := range validationErrors {

		errors[fieldError.Field()] = getErrorMessage(fieldError)
	}

	return errors
}

func getErrorMessage(fe validator.FieldError) string {
	// fe.Tag() trả về mã lỗi như: required, min, email...
	switch fe.Tag() {
	case "required":
		return "Trường này không được để trống"
	case "email":
		return "Định dạng email không hợp lệ"
	case "min":
		// fe.Param() lấy tham số phụ. VD: min=3 thì Param là 3
		return fmt.Sprintf("Độ dài tối thiểu phải là %s ký tự", fe.Param())
	case "max":
		return fmt.Sprintf("Độ dài tối đa chỉ được %s ký tự", fe.Param())
	case "alphanum":
		return "Chỉ được chứa chữ cái và số (không ký tự đặc biệt)"
	case "oneof":
		// Thay thế khoảng trắng bằng dấu phẩy cho đẹp. VD: "user admin" -> "user, admin"
		return fmt.Sprintf("Giá trị phải là một trong các loại: %s", strings.ReplaceAll(fe.Param(), " ", ", "))
	case "gt": // greater than
		return fmt.Sprintf("Giá trị phải lớn hơn %s", fe.Param())
	default:
		// Trường hợp lỗi lạ chưa định nghĩa
		return fmt.Sprintf("Lỗi không xác định (%s)", fe.Tag())
	}
}
>>>>>>> df8a219 (up)
