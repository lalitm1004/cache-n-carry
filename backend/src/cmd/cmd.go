package cmd

import (
	"cache-n-carry/src/server"
	"cache-n-carry/src/state"
	"flag"
)

func Execute() {
	port := flag.Int("port", 3100, "Port the server will run on")
	flag.Parse()

	stateConfig := &state.StateConfig{
		Port: *port,
	}

	srv := server.NewServer(stateConfig)

	server.Run(srv)
}
