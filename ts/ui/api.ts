
import { SpecialName } from 'ui/common/special_name'

export enum UiMode {
	UNKNOWN,
	GAME,

	CHAT,
	DIALOG,
	LOGIN,
	MENU,
}

export enum AnnouncementType {
	UNKNOWN,
	DISCONNECTED,
	DISCONNECTED_SIGNALING,
	GAME_FINISH,
	GAME_ERROR,
	LEVEL,
	PLAYER_JOINED,
	PLAYER_LEFT,
	WELCOME,
}

export enum DialogType {
	UNKNOWN,
	INIT,
	LOADOUT,
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

	// TODO: implement these
	MENU,
	CHAT,
	SCOREBOARD,
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
	CONTROLS,
	FAILED_DIALOG_SYNC,
	JUST_A_SIGN,
	OPEN_CRATE,
	SPAWN,
	SPECTATING,
	START_GAME,
}