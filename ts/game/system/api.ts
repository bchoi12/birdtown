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
