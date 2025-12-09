
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

	// Doesn't show chat
	LOG,
	// Show chat, no sound. Only show for others
	INFORM,
	// Show chat, play sound
	PRINT,
	// Also red
	ERROR,
}

export type ChatOptions = {
	// Prepend name of client
	clientId? : number;
}

export enum DialogType {
	UNKNOWN,
	DISCONNECTED,
	FAILED_CONNECT,
	FAILED_COPY,
	INIT,
	LOADOUT,
	RETURN_TO_LOBBY,
	START_GAME,
	QUERY_LOCATION,
	QUIT,
	REMATCH,
	RESET_SETTINGS,
	VERSION_MISMATCH,
	YOUR_ROOM,
}

export enum FeedType {
	UNKNOWN,

	// about to win
	ONE_MORE,

	JOIN,
	KICK,
	KILL,
	LEAVE,
	READY,
	SUICIDE,
}

export enum HudType {
	UNKNOWN,
	BACKFLIP,
	BOOSTER,
	CHARGE,
	DASH,
	BULLETS,
	GOLDEN,
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
	TORNADO,
}

export type HudOptions = {
	// Default to false
	charging? : boolean;

	// Default to 0
	percentGone? : number;

	// If empty, do not set anything. Override count with text if set. Otherwise try count.
	empty? : boolean;
	count? : number;

	// HTML color. Currently unused
	color? : string;

	// Only set one
	keyType? : KeyType;
	keyLives? : number;
}

export enum InfoType {
	UNKNOWN,

	DEATHS,
	LIVES,
	KILLS,
	VICTORIES,
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

	SCOREBOARD,
	MENU,
	CHAT,
	POINTER_LOCK,
	PHOTO,
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

	DEGRADED,
	HOST_DEGRADED,
	KEYS,
	SPECTATING,
}

export enum TooltipType {
	UNKNOWN,
	BEING_REVIVED,
	BUBBLE,
	BUFF_ACQUIRED,
	BUFF_CRATE,
	CONTROLS,
	COPIED_URL,
	FORCE_SUBMIT,
	JUST_A_SIGN,
	HEALTH_CRATE,
	HIKING_SWIM,
	HIKING_NIGHT,
	MUSIC,
	POINTER_LOCK,
	REMATCH,
	REMATCH_FAILED,
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