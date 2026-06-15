package setting

import "golang/internal/model"

type SettingController interface {
	GetSettings() (*model.PublicSettingsResponse, error)
	UpdateSettings(req model.UpdateSettingsRequest) error
}
