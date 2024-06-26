
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
	GAME_ERROR,
	GAME_FINISH,
	GAME_VICTORY,
	LEVEL,
	PLAYER_JOINED,
	PLAYER_LEFT,
	WELCOME,
}

export enum DialogType {
	UNKNOWN,
	INIT,
	LOADOUT,
	START_GAME,
}

export enum FeedType {
	UNKNOWN,

	JOIN,
	KICK,
	KILL,
	LEAVE,
	SUICIDE,
}

export enum InfoType {
	UNKNOWN,

	DEATHS,
	LIVES,
	KILLS,
	NAME,
	PING,
	SCORE,
	VICTORIES,
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
	COPIED_URL,
	FAILED_DIALOG_SYNC,
	JUST_A_SIGN,
	OPEN_CRATE,
	SPAWN,
	SPECTATING,
	START_GAME,
}

export type CounterOptions = {
	// Default to 0
	percentGone? : number;

	// Override count with text if set. Otherwise count = 0
	count? : number;
	text? : string;

	// HTML color
	color? : string;
}

export type TooltipOptions = {
	ttl?: number;
	names?: Array<string>;
}