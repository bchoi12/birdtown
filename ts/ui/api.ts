export enum UiMode {
	UNKNOWN,
	DEFAULT,

	CHAT,
	GAME,
	PAUSE,
}

export enum HandlerType {
	UNKNOWN,

	CHAT,
	CLIENTS,
	DIALOGS,
	INPUT,
	KEY_BIND,
	LOGIN,
	PAUSE,
	SETTINGS,
	STATS,
}

export enum Key {
	UNKNOWN,
	LEFT,
	RIGHT,
	JUMP,
	INTERACT,

	MOUSE_CLICK,
	ALT_MOUSE_CLICK,
}

export enum MouseCoordinates {
	UNKNOWN,
	PIXEL,
	SCREEN,
}

export type NewClientMsg = {
	gameId : number;
	displayName : string;
	isSelf : boolean;
}