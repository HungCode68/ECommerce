package setting

import (
	"database/sql"
	"golang/internal/model"
	settingRepo "golang/internal/repository/setting"
	"golang/internal/controller/audit"
)

type settingController struct {
	repo      settingRepo.SettingRepository
	AuditCtrl audit.AuditController
}

func NewSettingController(repo settingRepo.SettingRepository, auditCtrl audit.AuditController) SettingController {
	return &settingController{repo: repo, AuditCtrl: auditCtrl}
}

func (c *settingController) GetSettings() (*model.PublicSettingsResponse, error) {
	zaloLink := "https://zalo.me"
	hotline := "19006680"

	zaloSetting, err := c.repo.GetByKey("zalo_link")
	if err == nil && zaloSetting != nil {
		zaloLink = zaloSetting.Value
	} else if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	hotlineSetting, err := c.repo.GetByKey("hotline")
	if err == nil && hotlineSetting != nil {
		hotline = hotlineSetting.Value
	} else if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	return &model.PublicSettingsResponse{
		ZaloLink: zaloLink,
		Hotline:  hotline,
	}, nil
}

func (c *settingController) UpdateSettings(adminID int64, req model.UpdateSettingsRequest) error {
	// Ghi log
	c.AuditCtrl.LogAction(adminID, "UPDATE", "SETTING", "zalo_link", nil, &req.ZaloLink)
	c.AuditCtrl.LogAction(adminID, "UPDATE", "SETTING", "hotline", nil, &req.Hotline)

	err := c.repo.Upsert(&model.SystemSetting{
		Key:   "zalo_link",
		Value: req.ZaloLink,
	})
	if err != nil {
		return err
	}

	return c.repo.Upsert(&model.SystemSetting{
		Key:   "hotline",
		Value: req.Hotline,
	})
}
