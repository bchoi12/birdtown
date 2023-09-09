

export enum GameState {
	UNKNOWN,

	// Waiting to meet criteria to start a game
	FREE,

	// Load level and wait for client input if necessary
	SETUP,
	
	// All setup finished, everyone is gaming
	GAME,

	// Finishing criteria met, game is over and can be reset
	FINISH,

	// Game is completely won
	VICTORY,

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

export enum GameObjectState {
	UNKNOWN,

	NORMAL,

	// Only applicable for entities
	DISABLE_INPUT,

	// Disables all logic in object step
	DEACTIVATED,
}

export enum PlayerRole {
	UNKNOWN,

	// Player is not participating, but is watching
	WAITING,

	// Player is playing a game
	GAMING,
}