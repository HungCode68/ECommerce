package callback

import "net/http"

type CallbackHandler interface {
	PublicCreate(w http.ResponseWriter, r *http.Request)
	AdminGetAll(w http.ResponseWriter, r *http.Request)
	AdminUpdateStatus(w http.ResponseWriter, r *http.Request)
	AdminDelete(w http.ResponseWriter, r *http.Request)
}
