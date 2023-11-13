
import { SpecialName } from 'ui/util/special_name'

export enum UiMode {
	UNKNOWN,
	DEFAULT,
	CHAT,
	GAME,
	PAUSE,
}

export enum AnnouncementType {
	UNKNOWN,
	LEVEL,
	DISCONNECTED,
	DISCONNECTED_SIGNALING,
	GAME_FINISH,
	GAME_ERROR,
}

export enum CounterType {
	UNKOWN,
	HEALTH,
	JUICE,
	ROCKET,
}

export enum DialogType {
	UNKNOWN,
	PICK_LOADOUT,
	PICK_GAME_MODE,
}

export enum KeyType {
	UNKNOWN,
	LEFT,
	RIGHT,
	JUMP,
	INTERACT,
	SQUAWK,
	MOUSE_CLICK,
	ALT_MOUSE_CLICK,
}

export enum KeyState {
	UNKNOWN,

	UP,
	DOWN,
	PRESSED,
	RELEASED,
}

export enum TooltipType {
	UNKNOWN,
	CONSOLE,
	SPAWN,
	SPECTATING,
}