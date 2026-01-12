
export enum SystemType {
	UNKNOWN,
	ANNOUNCER,
	AUDIO,
	BUSTER,
	CLIENT_DIALOG,
	CLIENT_DIALOG_SYNCER,
	CLIENT_DIALOGS,
	CLOUD_GENERATOR,
	CONTROLLER,
	ENEMY_GENERATOR,
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

	PEACEFUL,
	UPBEAT,
	DRAMATIC,
}

export enum LevelType {
	UNKNOWN,
	BIRDTOWN,
	BIRDROCK,

	// Cannot random
	LOBBY,

	// Special values
	RANDOM,
}

export enum LevelLayout {
	UNKNOWN,

	NORMAL,
	CIRCLE,
	TINY,
	MIRROR,

	INVASION,
}

// TODO: make _TURNS a different option
export enum LoadoutType {
	UNKNOWN,

	PICK_TURNS,
	PICK,
	CHOOSE_TURNS,
	CHOOSE,
	RANDOM,
	RANDOM_ALL,
	GOLDEN_GUN,

	BUFF,
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

	DAWN,
	DAY,
	EVENING,
	NIGHT,
}

export enum WeaponSetType {
	UNKNOWN,

	RECOMMENDED,
	ALL,
}

export enum WinConditionType {
	UNKNOWN,

	NONE,
	LIVES,
	POINTS,
	TEAM_LIVES,
	TEAM_POINTS,

	COOP,
}