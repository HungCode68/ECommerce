package setting

import "golang/internal/model"

type SettingRepository interface {
	GetByKey(key string) (*model.SystemSetting, error)
	Upsert(setting *model.SystemSetting) error
}
