export enum SystemType {
	UNKNOWN,
	CLIENT_INFO,
	CLIENT_INFOS,
	CLIENT_STATE,
	CLIENT_STATES,
	DUEL_MAKER,
	DUEL_MODE,
	ENTITIES,
	ENTITY_MAP,
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

export type NewClientMsg = {
	displayName : string;
	gameId : number;
}

export type LevelLoadMsg = {
	level : LevelType;
	version : number;
	seed : number;
}
