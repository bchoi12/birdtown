
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
	GAME_END,
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
	RETURN_TO_LOBBY,
	START_GAME,
}

export enum FeedType {
	UNKNOWN,

	JOIN,
	KICK,
	KILL,
	LEAVE,
	READY,
	SUICIDE,
}

export enum HudType {
	UNKOWN,
	BLACK_HOLE,
	CHARGE,
	DASH,
	BULLETS,
	HEALTH,
	JETPACK,
	JUICE,
	ROCKET,
	ROLL,
	SPRAY,
	SQUAWK,
	STAR,
}

export type HudOptions = {
	// Default to false
	charging? : boolean;

	// Default to 0
	percentGone? : number;

	// If empty, do not set anything. Override count with text if set. Otherwise try count.
	empty? : boolean;
	text? : string;
	count? : number;

	// HTML color
	color? : string;

	// Only set one
	keyType? : KeyType;
	keyHTML? : string;
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
}

export enum KeyState {
	UNKNOWN,

	UP,
	DOWN,
	PRESSED,
	RELEASED,
}

export enum StatusType {
	UNKNOWN,

	DISCONNECTED,
	DISCONNECTED_SIGNALING,
	LOBBY,
}

export enum TooltipType {
	UNKNOWN,
	CONTROLS,
	COPIED_URL,
	FORCE_SUBMIT,
	JUST_A_SIGN,
	HEALTH_CRATE,
	SPAWN,
	SPECTATING,
	START_GAME,
	WEAPON_CRATE,
}

export type TooltipOptions = {
	ttl?: number;
	names?: Array<string>;
}