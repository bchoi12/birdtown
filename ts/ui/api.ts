
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
	GAME_STARTING,
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
	DISCONNECTED,
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
	BACKFLIP,
	BOOSTER,
	CHARGE,
	DASH,
	BULLETS,
	HEADPHONES,
	HEALTH,
	JETPACK,
	JUICE,
	MOUSE_LOCK,
	ORBS,
	POCKET_ROCKET,
	ROCKET,
	ROLL,
	SPRAY,
	SQUAWK,
	STAR,
	SWORDS,
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
	ROUND_WINS,
	SCORE,
	WINS,
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

	LOBBY,
	SPECTATING,
	LOADING,
	SETUP,
}

export enum TempStatusType {
	UNKNOWN,

	DISCONNECTED_SIGNALING,
	DEGRADED,
	HOST_DEGRADED,
	KEYS,
}

export enum TooltipType {
	UNKNOWN,
	BEING_REVIVED,
	BUBBLE,
	CONTROLS,
	COPIED_URL,
	FORCE_SUBMIT,
	JUST_A_SIGN,
	HEALTH_CRATE,
	POINTER_LOCK,
	REVIVE,
	REVIVING,
	SPAWN,
	START_GAME,
	WEAPON_CRATE,
}

export type TooltipOptions = {
	ttl?: number;
	names?: Array<string>;
}