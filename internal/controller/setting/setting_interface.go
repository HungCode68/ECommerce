package setting

import "golang/internal/model"

type SettingController interface {
	GetSettings() (*model.PublicSettingsResponse, error)
	UpdateSettings(adminID int64, req model.UpdateSettingsRequest) error
}
