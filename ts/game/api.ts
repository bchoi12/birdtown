

export enum GameState {
	UNKNOWN,

	// Waiting to start a game
	FREE,

	// Game starting imminently or transition prior to loading level
	PRELOAD,

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

	FREE,

	// beta 1.0
	DUEL,
	FREE_FOR_ALL,
	PRACTICE,
	SPREE,
	SUDDEN_DEATH,
	SURVIVAL,
	TEAM_BATTLE,

	// v1.1
	GOLDEN_GUN,
	VIP,
	BUFF_BATTLE,
	TEAM_DEATHMATCH,

	// TBD
	INVASION,
}

export enum GameObjectState {
	UNKNOWN,

	NORMAL,

	// Only applicable for entities
	DISABLE_INPUT,

	// Disables all logic in object step
	DEACTIVATED,
}