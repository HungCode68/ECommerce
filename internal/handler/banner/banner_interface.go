package banner

import "net/http"

type BannerHandler interface {
	AdminGetAllBanners(w http.ResponseWriter, r *http.Request)
	UserGetActiveBanners(w http.ResponseWriter, r *http.Request)
	AdminCreateBanner(w http.ResponseWriter, r *http.Request)
	AdminUpdateBanner(w http.ResponseWriter, r *http.Request)
	AdminDeleteBanner(w http.ResponseWriter, r *http.Request)
}

