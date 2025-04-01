package state

type State struct {
	Port int
}

type StateConfig struct {
	Port int
}

func NewState(sc *StateConfig) *State {
	return &State{Port: sc.Port}
}
