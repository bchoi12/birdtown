
export enum ClientConnectionState {
	UNKNOWN,
	CONNECTED,
	DISCONNECTED,
}

export enum ClientGameState {
	UNKNOWN,
	SPECTATING,
	GAMING,
}

export enum ClientLoadState {
	UNKNOWN,
	WAITING,
	LOADED,
	CHECK_READY,
	READY,
}

export enum ControllerState {
	UNKNOWN,
	WAITING,
	SETUP,
	STARTED,
	FINISH,
}

export enum SystemType {
	UNKNOWN,
	AUDIO,
	CLIENT_STATE,
	CLIENT_STATES,
	ENTITIES,
	ENTITY_MAP,
	GAME_MODE,
	INPUT,
	KEYS,
	LAKITU,
	LEVEL,
	PHYSICS,
	PLAYER_STATE,
	PLAYER_STATES,
	RUNNER,
	WORLD,
}

export enum LevelType {
	UNKNOWN,
	BIRDTOWN,
	LOBBY,
}

export enum MusicType {
	UNKNOWN,
}

export enum SoundType {
	UNKNOWN,

	EXPLOSION,
}