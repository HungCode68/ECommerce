package audit

import (
	"net/http"
)

type AuditHandler interface {
	GetLogs(w http.ResponseWriter, r *http.Request)
}
