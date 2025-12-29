package user

import (
	"encoding/json"
	"golang/internal/controller/user"
	"golang/internal/model"
	"golang/internal/utils"
	"golang/internal/validator"
	"net/http"
	"strconv"
)

type userHandler struct {
	UserController user.UserController
}

// NewUserHandler - Khởi tạo user handler
func NewUserHandler(userController user.UserController) UserHandler {
	return &userHandler{
		UserController: userController,
	}
}

// Register - Đăng ký tài khoản mới
func (h *userHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.UserController.Register(req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi đăng ký tài khoản", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusCreated, "Đăng ký thành công", res)
}

// Login - Đăng nhập tài khoản
func (h *userHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.UserController.Login(req)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Đăng nhập thất bại", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Đăng nhập thành công", res)
}

// Logout - Đăng xuất tài khoản
func (h *userHandler) Logout(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Không xác định được người dùng", "Token lỗi")
		return
	}

	err := h.UserController.Logout(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi khi đăng xuất", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Đăng xuất thành công", nil)
}

// CreateAdmin - Tạo tài khoản Admin
func (h *userHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.UserController.CreateAdmin(req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi tạo tài khoản Admin", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusCreated, "Tạo Admin thành công", res)
}

// GetAllUsers - Lấy danh sách tất cả người dùng
func (h *userHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.UserController.GetAllUsers()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy danh sách user", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Lấy danh sách thành công", users)
}

// GetUserByID - Lấy thông tin chi tiết người dùng theo ID
func (h *userHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	if id <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải lớn hơn 0")
		return
	}

	user, err := h.UserController.GetUserByID(id)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy thông tin user", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Lấy thông tin thành công", user)
}

// SearchUsers - Tìm kiếm người dùng theo từ khóa
func (h *userHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	//  Parse dữ liệu (String -> Struct Type)
	keyword := query.Get("keyword")
	role := query.Get("role")

	// Parse IsActive
	var isActive *bool
	if val := query.Get("is_active"); val != "" {
		b, err := strconv.ParseBool(val)
		if err != nil {
			// Nếu nhập sai (VD: "abc", "1234") -> Báo lỗi ngay
			utils.WriteError(w, http.StatusBadRequest, "Tham số không hợp lệ", err.Error())
			return
		}
		isActive = &b
	}

	// Parse IsDeleted
	var isDeleted *bool
	if val := query.Get("is_deleted"); val != "" {
		b, err := strconv.ParseBool(val)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "Tham số không hợp lệ ", err.Error())
			return
		}
		isDeleted = &b
	}

	// Parse Page (Mặc định 1)
	page, err := strconv.Atoi(query.Get("page"))
	if err != nil || page < 1 {
		page = 1
	}

	// Parse Limit (Mặc định 10)
	limit, err := strconv.Atoi(query.Get("limit"))
	if err != nil || limit < 1 {
		limit = 10
	}

	// 2. Tạo struct Filter
	filter := model.UserFilter{
		Keyword:   keyword,
		Role:      role,
		IsActive:  isActive,
		IsDeleted: isDeleted,
		Page:      page,
		Limit:     limit,
	}

	if errs := validator.Validate(filter); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Tham số lọc không hợp lệ", errs)
		return
	}

	// Gọi Controller
	users, total, err := h.UserController.SearchUsers(filter)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi lấy danh sách user", err.Error())
		return
	}

	// Trả về kết quả
	utils.WriteJSON(w, http.StatusOK, "Thành công", map[string]interface{}{
		"users": users,
		"meta": map[string]interface{}{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// UpdateUser - Cập nhật thông tin người dùng (Admin)
func (h *userHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
		return
	}

	var req model.AdminUpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.UserController.UpdateUser(id, req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi cập nhật user", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Cập nhật thành công", res)
}

// UpdateUserProfile - Người dùng tự cập nhật thông tin cá nhân
func (h *userHandler) UpdateUserProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Không xác định được người dùng", "Token lỗi")
		return
	}

	var req model.UserUpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	res, err := h.UserController.UpdateUserProfile(userID, req)
	if err != nil {
		if err.Error() == "tên đăng nhập đã được sử dụng" || err.Error() == "email đã được sử dụng" {
			utils.WriteError(w, http.StatusConflict, "Dữ liệu trùng lặp", err.Error())
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi cập nhật profile", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Cập nhật thông tin cá nhân thành công", res)
}

// DeleteMyAccount - Người dùng tự xóa tài khoản của mình
func (h *userHandler) DeleteMyAccount(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int64)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Không xác định được người dùng", "Token lỗi")
		return
	}

	err := h.UserController.DeleteMyAccount(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi xóa tài khoản", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Đã xóa tài khoản thành công", nil)
}

// DeleteUserById - Xóa người dùng theo ID (Admin)
// func (h *userHandler) DeleteUserById(w http.ResponseWriter, r *http.Request) {
// 	idStr := r.PathValue("id")
// 	id, err := strconv.ParseInt(idStr, 10, 64)
// 	if err != nil {
// 		utils.WriteError(w, http.StatusBadRequest, "ID không hợp lệ", "ID phải là số nguyên")
// 		return
// 	}

// 	err = h.UserController.DeleteUserById(id)
// 	if err != nil {
// 		utils.WriteError(w, http.StatusInternalServerError, "Lỗi xóa user", err.Error())
// 		return
// 	}

// 	utils.WriteJSON(w, http.StatusOK, "Xóa user thành công", nil)
// }

// DeleteUsers - Xóa nhiều người dùng cùng lúc (Admin)
func (h *userHandler) DeleteSoftUsers(w http.ResponseWriter, r *http.Request) {
	var req model.AdminDeleteManyUsersRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	if errs := validator.Validate(req); errs != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu đầu vào không hợp lệ", errs)
		return
	}

	err := h.UserController.DeleteSoftUsers(req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Lỗi xóa danh sách user", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Xóa danh sách user thành công", nil)
}

// RefreshToken - Làm mới access token
func (h *userHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req model.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ", err.Error())
		return
	}

	res, err := h.UserController.RefreshToken(req)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Không thể làm mới token", err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, "Làm mới token thành công", res)
}
