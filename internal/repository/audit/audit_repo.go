package audit

import (
	"database/sql"
	"golang/internal/model"
)

type auditRepo struct {
	db *sql.DB
}

func NewAuditRepo(db *sql.DB) AuditRepo {
	return &auditRepo{db: db}
}

func (r *auditRepo) InsertLog(log model.AdminAuditLog) error {
	query := `
		INSERT INTO admin_audit_logs (admin_id, action, entity_type, entity_id, old_values, new_values)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query,
		log.AdminID,
		log.Action,
		log.EntityType,
		log.EntityID,
		log.OldValues,
		log.NewValues,
	)
	return err
}

func (r *auditRepo) GetLogs(page, limit int, entityType, action string) ([]model.AdminAuditLog, int, error) {
	offset := (page - 1) * limit
	whereClause := "WHERE 1=1"
	var args []interface{}

	if entityType != "" {
		whereClause += " AND a.entity_type = ?"
		args = append(args, entityType)
	}
	if action != "" {
		whereClause += " AND a.action = ?"
		args = append(args, action)
	}

	// Đếm tổng số
	var total int
	countQuery := "SELECT COUNT(*) FROM admin_audit_logs a " + whereClause
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Lấy dữ liệu
	query := `
		SELECT 
			a.id, a.admin_id, u.username as admin_name, a.action, a.entity_type, a.entity_id, 
			a.old_values, a.new_values, a.created_at
		FROM admin_audit_logs a
		LEFT JOIN users u ON a.admin_id = u.id
		` + whereClause + `
		ORDER BY a.id DESC
		LIMIT ? OFFSET ?
	`
	
	args = append(args, limit, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []model.AdminAuditLog
	for rows.Next() {
		var log model.AdminAuditLog
		var oldValues, newValues sql.NullString
		var adminName sql.NullString
		
		err := rows.Scan(
			&log.ID, &log.AdminID, &adminName, &log.Action, &log.EntityType, &log.EntityID,
			&oldValues, &newValues, &log.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		
		if adminName.Valid {
			log.AdminName = adminName.String
		}
		if oldValues.Valid {
			val := oldValues.String
			log.OldValues = &val
		}
		if newValues.Valid {
			val := newValues.String
			log.NewValues = &val
		}
		
		logs = append(logs, log)
	}
	
	return logs, total, nil
}
