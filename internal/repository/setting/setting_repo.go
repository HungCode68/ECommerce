package setting

import (
	"database/sql"
	"golang/internal/model"
)

type settingRepo struct {
	db *sql.DB
}

func NewSettingRepo(db *sql.DB) SettingRepository {
	return &settingRepo{db: db}
}

func (r *settingRepo) GetByKey(key string) (*model.SystemSetting, error) {
	var item model.SystemSetting
	err := r.db.QueryRow(`
		SELECT ` + "`key`" + `, value, created_at, updated_at
		FROM system_settings
		WHERE ` + "`key`" + ` = ?`, key).Scan(
		&item.Key,
		&item.Value,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *settingRepo) Upsert(setting *model.SystemSetting) error {
	_, err := r.db.Exec(`
		INSERT INTO system_settings (` + "`key`" + `, value, updated_at)
		VALUES (?, ?, NOW())
		ON DUPLICATE KEY UPDATE value = ?, updated_at = NOW()`,
		setting.Key,
		setting.Value,
		setting.Value,
	)
	return err
}
