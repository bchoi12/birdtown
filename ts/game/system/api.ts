
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
	CLIENT_SIDE_STATE,
	CLIENT_SIDE_STATES,
	ENTITIES,
	ENTITY_MAP,
	GAME_MODE,
	INPUT,
	KEYS,
	LAKITU,
	LEVEL,
	PHYSICS,
	RUNNER,
	WORLD,
}

export enum LevelType {
	UNKNOWN,
	BIRDTOWN,
	LOBBY,
}