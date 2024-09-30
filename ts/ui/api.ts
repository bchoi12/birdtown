
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
	GENERIC,
	LEVEL,
	PLAYER_JOINED,
	PLAYER_LEFT,
	WELCOME,
}

export enum ChatType {
	UNKNOWN,

	// Do not parse chat message as HTML
	CHAT,

	ERROR,

	// Silent and doesn't show chat
	LOG,

	PRINT,
}

export type ChatOptions = {
	// Prepend name of client
	clientId? : number;
}

export enum DialogType {
	UNKNOWN,
	INIT,
	LOADOUT,
	RETURN_TO_LOBBY,
	START_GAME,
	QUIT,
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
	BOOSTER,
	CHARGE,
	DASH,
	BULLETS,
	HEALTH,
	JETPACK,
	JUICE,
	MOUSE_LOCK,
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
	count? : number;

	// HTML color
	color? : string;

	// Only set one
	keyType? : KeyType;
	keyCode? : number;
	keyLives? : number;
}

export enum InfoType {
	UNKNOWN,

	DEATHS,
	LIVES,
	KILLS,
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

	WELCOME,
	DISCONNECTED,
	DISCONNECTED_SIGNALING,
	HOST_DEGRADED,
	DEGRADED,
	SPECTATING,
	LOADING,
	SETUP,
	LOBBY,
}

export enum TooltipType {
	UNKNOWN,
	BUBBLE,
	CONTROLS,
	COPIED_URL,
	FORCE_SUBMIT,
	JUST_A_SIGN,
	HEALTH_CRATE,
	POINTER_LOCK,
	SPAWN,
	START_GAME,
	WEAPON_CRATE,
}

export type TooltipOptions = {
	ttl?: number;
	names?: Array<string>;
}