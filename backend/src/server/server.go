package server

import (
	"cache-n-carry/src/state"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Server struct {
	*chi.Mux
	State  *state.State
	Logger *slog.Logger
}

func NewServer(stateConfig *state.StateConfig) *Server {
	return &Server{Mux: chi.NewMux(), State: state.NewState(stateConfig), Logger: slog.Default()}
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.Mux.ServeHTTP(w, r)
}

func Run(s *Server) {
	s.Logger.Info(fmt.Sprintf("Server is listening at port :%d", s.State.Port))
	http.ListenAndServe(fmt.Sprintf(":%d", s.State.Port), s.Mux)
}
