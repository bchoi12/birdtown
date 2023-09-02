

export enum GameState {
	UNKNOWN,

	// Waiting to meet criteria to start a game
	WAIT,

	// Load level and wait for client input if necessary
	SETUP,
	
	// All setup finished, everyone is gaming
	GAME,

	// Finishing criteria met, game is over and can be reset
	FINISH,

	// Reached error state and need to restart
	ERROR,

	// Reached unrecoverable error state and page needs to be fully reloaded
	FATAL,
}

export enum GameMode {
	UNKNOWN,

	DUEL,
	FREE_FOR_ALL,
}