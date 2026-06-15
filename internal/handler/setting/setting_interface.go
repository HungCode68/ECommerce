package setting

import "net/http"

type SettingHandler interface {
	GetSettings(w http.ResponseWriter, r *http.Request)
	UpdateSettings(w http.ResponseWriter, r *http.Request)
}
