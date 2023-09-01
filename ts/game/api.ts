

export enum GameState {
	UNKNOWN,

	// Loading initial resources to run the game
	INITIALIZING,

	// Waiting to meet criteria to start a game
	WAITING,

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