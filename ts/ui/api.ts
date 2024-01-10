
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
	DISCONNECTED,
	DISCONNECTED_SIGNALING,
	GAME_FINISH,
	GAME_ERROR,
	LEVEL,
	WELCOME,
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
	FAILED_DIALOG_SYNC,
	JUST_A_SIGN,
	SPAWN,
	SPECTATING,
	START_GAME,
}