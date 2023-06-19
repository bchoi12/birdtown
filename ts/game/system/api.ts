
export enum ClientConnectionState {
	UNKNOWN,
	CONNECTED,
	DISCONNECTED,
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
	RUNNER,
	WORLD,
}

export enum LevelType {
	UNKNOWN,
	BIRDTOWN,
	LOBBY,
}