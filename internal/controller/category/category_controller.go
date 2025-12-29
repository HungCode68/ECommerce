package category

import (
	"errors"
	"fmt"
	"golang/internal/logger"
	"golang/internal/model"
	"golang/internal/repository/category"

	"github.com/gosimple/slug"
)

type categoryController struct {
	CategoryRepo category.CategoryRepo
}

func NewCategoryController(catRepo category.CategoryRepo) CategoryController {
	return &categoryController{
		CategoryRepo: catRepo,
	}
}


// CreateCategory - Tạo danh mục mới
func (c *categoryController) CreateCategory(req model.CreateCategoryRequest) (model.AdminCategoryResponse, error) {
	logger.InfoLogger.Printf("Admin yêu cầu tạo danh mục mới: %s", req.Name)

	//  Xử lý Slug (Nếu rỗng thì tự tạo từ Name)
	finalSlug := req.Slug
	if finalSlug == "" {
		finalSlug = slug.Make(req.Name)
	} else {
		finalSlug = slug.Make(finalSlug)
	}

	// Kiểm tra trùng Slug
	isExist, err := c.CategoryRepo.CheckSlugExist(finalSlug)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi kiểm tra slug: %v", err)
		return model.AdminCategoryResponse{}, err
	}
	if isExist {
		return model.AdminCategoryResponse{}, errors.New("slug danh mục đã tồn tại, vui lòng chọn tên khác")
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	newCat := model.Category{
		Name:        req.Name,
		Slug:        finalSlug,
		Description: &req.Description, 
		IsActive:    isActive,
	}
	if req.Description == "" {
		newCat.Description = nil
	} else {
		val := req.Description
		newCat.Description = &val
	}

	// Gọi Repo tạo
	createdCat, err := c.CategoryRepo.CreateCategory(&newCat)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi tạo danh mục: %v", err)
		return model.AdminCategoryResponse{}, err
	}

	res := model.AdminCategoryResponse{
		ID:          createdCat.ID,
		Name:        createdCat.Name,
		Slug:        createdCat.Slug,
		Description: createdCat.Description,
		IsActive:    createdCat.IsActive,
		CreatedAt:   createdCat.CreatedAt,
		UpdatedAt:   createdCat.UpdatedAt,
	}

	logger.InfoLogger.Printf("Tạo thành công danh mục ID: %d", createdCat.ID)
	return res, nil
}

// UpdateCategory - Cập nhật danh mục
func (c *categoryController) UpdateCategory(id int64, req model.UpdateCategoryRequest) (model.AdminCategoryResponse, error) {
	logger.InfoLogger.Printf("Admin cập nhật danh mục ID: %d", id)

	//  Kiểm tra Slug nếu có thay đổi
	if req.Slug != nil && *req.Slug != "" {
		newSlug := slug.Make(*req.Slug)
		
		// Lấy danh mục cũ để so sánh xem slug có thực sự đổi không
		oldCat, err := c.CategoryRepo.GetCategoryByID(id)
		if err != nil {
			return model.AdminCategoryResponse{}, errors.New("không tìm thấy danh mục cần sửa")
		}

		if oldCat.Slug != newSlug {
			isExist, err := c.CategoryRepo.CheckSlugExist(newSlug)
			if err != nil {
				return model.AdminCategoryResponse{}, err
			}
			if isExist {
				return model.AdminCategoryResponse{}, fmt.Errorf("slug '%s' đã tồn tại", newSlug)
			}
			req.Slug = &newSlug // Cập nhật lại slug đã chuẩn hóa
		}
	}

	//  Gọi Repo Update
	updatedCat, err := c.CategoryRepo.UpdateCategory(id, req)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi update danh mục: %v", err)
		return model.AdminCategoryResponse{}, err
	}

	// Map Response
	res := model.AdminCategoryResponse{
		ID:          updatedCat.ID,
		Name:        updatedCat.Name,
		Slug:        updatedCat.Slug,
		Description: updatedCat.Description,
		IsActive:    updatedCat.IsActive,
		CreatedAt:   updatedCat.CreatedAt,
		UpdatedAt:   updatedCat.UpdatedAt,
	}

	return res, nil
}

// DeleteCategory - Xóa mềm 1 danh mục
// func (c *categoryController) DeleteCategory(id int64) error {
// 	logger.WarnLogger.Printf("Admin yêu cầu xóa (ẩn) danh mục ID: %d", id)
// 	err := c.CategoryRepo.DeleteCategory(id)
// 	if err != nil {
// 		logger.ErrorLogger.Printf("Lỗi xóa danh mục: %v", err)
// 		return err
// 	}
// 	return nil
// }

// DeleteManyCategories - Xóa mềm nhiều danh mục
func (c *categoryController) DeleteSoftCategories(req model.DeleteManyCategoriesRequest) error {
	logger.WarnLogger.Printf("Admin yêu cầu xóa %d danh mục", len(req.IDs))
	err := c.CategoryRepo.DeleteSoftCategories(req.IDs)
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi xóa nhiều danh mục: %v", err)
		return err
	}
	return nil
}

// DeleteCategoryHard - Xóa cứng 1 danh mục
func (c *categoryController) DeleteCategoryHard(id int64) error {
	logger.WarnLogger.Printf("Admin yêu cầu xóa cứng danh mục ID: %d", id)
    // Gọi Repo Xóa cứng
    err := c.CategoryRepo.DeleteCategoryHard(id)
    if err != nil {
        logger.ErrorLogger.Printf("Lỗi xóa cứng danh mục: %v", err)
        return err 
    }
    return nil
}

// AdminGetAllCategories - Lấy tất cả (Active + Inactive)
func (c *categoryController) AdminGetAllCategories(req model.AdminGetCategoriesRequest) ([]model.AdminCategoryResponse, int, error) {
	logger.InfoLogger.Println("Admin lấy tất cả danh mục")
	cats, total, err := c.CategoryRepo.GetAllCategories(req)
	if err != nil {
		return nil, 0, err
	}

	var response []model.AdminCategoryResponse
	for _, cat := range cats {
		response = append(response, model.AdminCategoryResponse{
			ID:          cat.ID,
			Name:        cat.Name,
			Slug:        cat.Slug,
			Description: cat.Description,
			IsActive:    cat.IsActive,
			CreatedAt:   cat.CreatedAt,
			UpdatedAt:   cat.UpdatedAt,
		})
	}

	if response == nil {
		response = []model.AdminCategoryResponse{}
	}

	return response, total, nil
}

// AdminGetCategoryByID - Lấy chi tiết theo ID
func (c *categoryController) AdminGetCategoryByID(id int64) (model.AdminCategoryResponse, error) {
	cat, err := c.CategoryRepo.GetCategoryByID(id)
	if err != nil {
		return model.AdminCategoryResponse{}, err
	}

	return model.AdminCategoryResponse{
		ID:          cat.ID,
		Name:        cat.Name,
		Slug:        cat.Slug,
		Description: cat.Description,
		IsActive:    cat.IsActive,
		CreatedAt:   cat.CreatedAt,
		UpdatedAt:   cat.UpdatedAt,
	}, nil
}

// AdminSearchCategories - Tìm kiếm (Active + Inactive)
func (c *categoryController) AdminSearchCategories(keyword string, isActive *bool) ([]model.AdminCategoryResponse, error) {
	cats, err := c.CategoryRepo.SearchAllCategories(keyword, isActive)
	if err != nil {
		logger.ErrorLogger.Printf("Controller: Failed to search categories. Error: %v", err)
		return nil, err
	}

	var response []model.AdminCategoryResponse
	for _, cat := range cats {
		response = append(response, model.AdminCategoryResponse{
			ID:          cat.ID,
			Name:        cat.Name,
			Slug:        cat.Slug,
			Description: cat.Description,
			IsActive:    cat.IsActive, 
			CreatedAt:   cat.CreatedAt,
			UpdatedAt:   cat.UpdatedAt,
		})
	}

	// Trả về mảng rỗng thay vì nil nếu không tìm thấy
	if response == nil {
		response = []model.AdminCategoryResponse{}
	}
	logger.InfoLogger.Printf("Controller: AdminSearchCategories success. Found %d categories", len(response))
	return response, nil
}


// UserGetActiveCategories - Lấy danh sách danh mục để hiển thị Menu
func (c *categoryController) UserGetActiveCategories() ([]model.UserCategoryResponse, error) {
	// Gọi Repo lấy danh sách ACTIVE
	cats, err := c.CategoryRepo.GetActiveCategories()
	if err != nil {
		logger.ErrorLogger.Printf("Lỗi lấy danh mục cho user: %v", err)
		return nil, err
	}

	var response []model.UserCategoryResponse
	for _, cat := range cats {
		response = append(response, model.UserCategoryResponse{
			Name: cat.Name,
			Slug: cat.Slug,
		})
	}
	
	if response == nil {
		response = []model.UserCategoryResponse{}
	}

	return response, nil
}

// UserSearchCategories - Tìm kiếm danh mục (Chỉ Active)
func (c *categoryController) UserSearchCategories(keyword string) ([]model.UserCategoryResponse, error) {
	logger.InfoLogger.Printf("User tìm kiếm danh mục: %s", keyword)

	cats, err := c.CategoryRepo.SearchActiveCategories(keyword)
	if err != nil {
		return nil, err
	}

	var response []model.UserCategoryResponse
	for _, cat := range cats {
		response = append(response, model.UserCategoryResponse{
			Name: cat.Name,
			Slug: cat.Slug,
		})
	}

	if response == nil {
		response = []model.UserCategoryResponse{}
	}

	return response, nil
}


