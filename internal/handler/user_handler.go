package handler

import (
	"encoding/json"
	"golang/internal/controller"
	"golang/internal/model"
	"golang/internal/validator"
	"net/http"
	"strconv"
	"strings"
)

func writeJSON(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := model.APIResponse{
		Code:    statusCode,
		Message: message,
		Data:    data,
		Errors:  nil,
	}

	json.NewEncoder(w).Encode(response)
}

// writeError: Trả về JSON lỗi
func writeError(w http.ResponseWriter, statusCode int, message string, errors interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := model.APIResponse{
		Code:    statusCode,
		Message: message,
		Data:    nil,
		Errors:  errors,
	}

	json.NewEncoder(w).Encode(response)
}

type UserHandler struct {
	UserController *controller.UserController
	Validator      *validator.CustomValidator // Thêm Validator vào đây để dùng
}

// NewUserHandler: Khởi tạo
func NewUserHandler(userController *controller.UserController, v *validator.CustomValidator) *UserHandler {
	return &UserHandler{
		UserController: userController,
		Validator:      v, // Gán validator vào struct
	}
}

// Hàm Register để đăng ký tài khoản mới
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest

	// Decode JSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	// Validate dữ liệu
	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	// Gọi Controller
	res, err := h.UserController.Register(req)
	if err != nil {
		
		writeError(w, http.StatusInternalServerError, "Lỗi đăng ký tài khoản", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, "Đăng ký thành công", res)
}

//  Đăng nhập (Login)
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.UserController.Login(req)
	if err != nil {
		// Login thất bại thường trả về 401 Unauthorized
		writeError(w, http.StatusUnauthorized, "Đăng nhập thất bại", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Đăng nhập thành công", res)
}


// Đăng xuất (Logout)
func (h *UserHandler) Logout(w http.ResponseWriter, r *http.Request) {
    //  Lấy UserID từ Context 
    userID, ok := r.Context().Value("userID").(int64)
    if !ok {
        writeError(w, http.StatusUnauthorized, "Không xác định được người dùng", "Token lỗi")
        return
    }

    //Gọi Controller xử lý
    err := h.UserController.Logout(userID)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "Lỗi khi đăng xuất", err.Error())
        return
    }

    //Trả về thành công
    writeJSON(w, http.StatusOK, "Đăng xuất thành công", nil)
}

//  Tạo Admin (CreateAdmin - Dành cho Admin)
func (h *UserHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.UserController.CreateAdmin(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi tạo tài khoản Admin", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, "Tạo Admin thành công", res)
}

// 4. Lấy danh sách (GetAllUsers)
func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.UserController.GetAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy danh sách user", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Lấy danh sách thành công", users)
}

//  Lấy chi tiết (GetUserByID)
func (h *UserHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	// Lấy ID từ URL 
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	// Validate ID > 0
	if id <= 0 {
		writeError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải lớn hơn 0")
		return
	}

	user, err := h.UserController.GetUserByID(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy thông tin user", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Lấy thông tin thành công", user)
}

// Tìm kiếm (SearchUsers)
func (h *UserHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	//Lấy keyword và CẮT BỎ khoảng trắng thừa 2 đầu
	rawKeyword := r.URL.Query().Get("q")
	keyword := strings.TrimSpace(rawKeyword)

	//Kiểm tra rỗng
	if keyword == "" {
		writeError(w, http.StatusBadRequest, "Thiếu từ khóa", "Vui lòng nhập từ khóa tìm kiếm (?q=...)")
		return
	}

	// Kiểm tra độ dài tối thiểu (Ví dụ: phải >= 2 ký tự)
	if len(keyword) < 2 {
		writeError(w, http.StatusBadRequest, "Từ khóa quá ngắn", "Vui lòng nhập ít nhất 2 ký tự")
		return
	}

	// Kiểm tra độ dài tối đa 
	if len(keyword) > 50 {
		writeError(w, http.StatusBadRequest, "Từ khóa quá dài", "Vui lòng nhập dưới 50 ký tự")
		return
	}

	//Gọi Controller
	users, err := h.UserController.SearchUsers(keyword)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi tìm kiếm", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Tìm kiếm thành công", users)
}

//  Cập nhật (UpdateUser)
func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	var req model.AdminUpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	// Validate struct Update
	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.UserController.UpdateUser(id, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi cập nhật user", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Cập nhật thành công", res)
}

// User tự cập nhật Profile (UpdateUserProfile)
func (h *UserHandler) UpdateUserProfile(w http.ResponseWriter, r *http.Request) {
	// Lấy ID từ Context (Được gán bởi AuthMiddleware)
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Không xác định được người dùng", "Token lỗi")
		return
	}

	var req model.UserUpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	// Validate
	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	// Gọi Controller
	res, err := h.UserController.UpdateUserProfile(userID, req)
	if err != nil {
		// Xử lý các lỗi conflict (trùng tên/email)
		if err.Error() == "tên đăng nhập đã được sử dụng" || err.Error() == "email đã được sử dụng" {
			writeError(w, http.StatusConflict, "Dữ liệu trùng lặp", err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "Lỗi cập nhật profile", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Cập nhật thông tin cá nhân thành công", res)
}

// User tự xóa tài khoản (DeleteMyAccount)
func (h *UserHandler) DeleteMyAccount(w http.ResponseWriter, r *http.Request) {
	// Lấy ID từ Context
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Không xác định được người dùng", "Token lỗi")
		return
	}

	err := h.UserController.DeleteMyAccount(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi xóa tài khoản", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Đã xóa tài khoản thành công", nil)
}

// 8. Xóa 1 user (DeleteUserById)
func (h *UserHandler) DeleteUserById(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	err = h.UserController.DeleteUserById(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi xóa user", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Xóa user thành công", nil)
}

// 9. Xóa nhiều user (DeleteManyUsers)
func (h *UserHandler) DeleteManyUsers(w http.ResponseWriter, r *http.Request) {
	var req model.AdminDeleteManyUsersRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	// Validate danh sách ID
	if errs := h.Validator.Validate(req); errs != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	err := h.UserController.DeleteManyUsers(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi xóa danh sách user", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Xóa danh sách user thành công", nil)
}


// Refresh Token Handler
func (h *UserHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
    var req model.RefreshTokenRequest
    // Decode JSON body để lấy { "refresh_token": "..." }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
        return
    }

    res, err := h.UserController.RefreshToken(req)
    if err != nil {
        writeError(w, http.StatusUnauthorized, "Không thể làm mới token", err.Error())
        return
    }

    writeJSON(w, http.StatusOK, "Làm mới token thành công", res)
}