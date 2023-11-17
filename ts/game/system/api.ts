
export enum SystemType {
	UNKNOWN,
	ANNOUNCER,
	AUDIO,
	CLIENT_DIALOG,
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

export enum RunnerMode {
	UNKNOWN,

	MINIMUM,
	SLOW,
	NORMAL,
	FAST,
}

export enum LevelType {
	UNKNOWN,
	BIRDTOWN,
	LOBBY,
}

export enum LevelLayout {
	UNKNOWN,

	NORMAL,
	CIRCLE,
}

export enum MusicType {
	UNKNOWN,
}

export enum SoundType {
	UNKNOWN,

	BAWK,
	EXPLOSION,
}

export enum ParticleType {
	UNKNOWN,

	SMOKE,
}

export enum PlayerRole {
	UNKNOWN,

	// Player is not participating, but is watching
	SPECTATING,

	// Player is participating, but we're not ready to spawn yet
	WAITING,

	// Player is not in the game, but can spawn
	SPAWNING,

	// Player is actively participating in the game
	GAMING,
}

export enum ScoreType {
	UNKNOWN,

	KILL,
	DEATH,
}
