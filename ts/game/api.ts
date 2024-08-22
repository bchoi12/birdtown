

export enum GameState {
	UNKNOWN,

	// Waiting to meet criteria to start a game
	FREE,

	// Load level
	LOAD,

	// Setup for the game and wait for client input if necessary
	SETUP,
	
	// All setup finished, everyone is gaming
	GAME,

	// Finishing criteria met, game is over and can be reset
	FINISH,

	// Game is completely won
	VICTORY,

	// Game was requested to be ended
	END,

	// Reached error state and need to restart
	ERROR,

	// Reached unrecoverable error state and page needs to be fully reloaded
	FATAL,
}

export enum GameMode {
	UNKNOWN,

	DUEL,
	FREE_FOR_ALL,
	PRACTICE,
	SURVIVAL,
}

export enum GameObjectState {
	UNKNOWN,

	NORMAL,

	// Only applicable for entities
	DISABLE_INPUT,

	// Disables all logic in object step
	DEACTIVATED,
}