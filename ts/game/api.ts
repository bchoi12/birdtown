

export enum GameState {
	UNKNOWN,

	// Waiting to meet criteria to start game
	WAITING,

	// Game started, all clients loading resources
	LOADING,

	// All resources loaded, clients answering dialogs
	SETUP,
	
	// All setup finished, everyone is gaming
	GAMING,

	// Finishing criteria met, game is over and can be reset
	FINISHING,
}

export enum GameMode {
	UNKNOWN,

	DUEL,
}