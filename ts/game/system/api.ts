
export enum SystemType {
	UNKNOWN,
	ANNOUNCER,
	AUDIO,
	CLIENT_DIALOG,
	CLIENT_DIALOG_SYNCER,
	CLIENT_DIALOGS,
	CLOUD_GENERATOR,
	CONTROLLER,
	ENTITIES,
	ENTITY_MAP,
	GAME_MAKER,
	INPUT,
	KEYS,
	KEY,
	LAKITU,
	LEVEL,
	MATERIAL_CACHE,
	PARTICLE_CACHE,
	PHYSICS,
	PLAYER_STATE,
	PLAYER_STATES,
	PIPELINE,
	TABLET,
	TABLETS,
	RUNNER,
	WORLD,
}

export enum AmbianceType {
	UNKNOWN,

	UPBEAT,
	DRAMATIC,
}

export enum LevelType {
	UNKNOWN,
	BIRDTOWN,
	BIRDTOWN_CIRCLE,
	DUELTOWN,
	LOBBY,
	TINYTOWN,
}

export enum LoadoutType {
	UNKNOWN,

	PICK,
	RANDOM,
	GOLDEN_GUN,
}

export enum PlayerRole {
	UNKNOWN,

	// Player is not participating, but is watching
	SPECTATING,

	// Player is getting ready
	PREPARING,

	// Player is not in the game, but can spawn
	SPAWNING,

	// Player is actively participating in the game
	GAMING,

	// Player is participating, but cannot game. Usually means dead
	WAITING,
}

export enum TimeType {
	UNKNOWN,

	DAY,
	EVENING,
	NIGHT,
}

export enum WinConditionType {
	UNKNOWN,

	NONE,
	LIVES,
	POINTS,
	TEAM_LIVES,
	TEAM_POINTS,
}