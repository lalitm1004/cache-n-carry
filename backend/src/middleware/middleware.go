package middleware

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func ApplyDefault(mux chi.Router) {

	mux.Use(
		cors.AllowAll().Handler,
	)

}
