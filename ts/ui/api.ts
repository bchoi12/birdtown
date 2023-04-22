
import { SpecialName } from 'ui/util/special_name'

export enum UiMode {
	UNKNOWN,
	DEFAULT,
	CHAT,
	GAME,
	PAUSE,
}

export enum HandlerType {
	UNKNOWN,
	ANNOUNCEMENT,
	CHAT,
	CLIENTS,
	DIALOGS,
	INPUT,
	KEY_BIND,
	LOGIN,
	PAUSE,
	SETTINGS,
	STATS,
	TOOLTIPS,
}

export enum AnnouncementType {
	UNKNOWN,
	TEST,
}

export enum DialogType {
	UNKNOWN,
	CHECK_READY,
}

export enum KeyType {
	UNKNOWN,
	LEFT,
	RIGHT,
	JUMP,
	INTERACT,
	MOUSE_CLICK,
	ALT_MOUSE_CLICK,
}

export enum TooltipType {
	UNKNOWN,
	TEST,
}

export type AnnouncementMsg = {
	type : AnnouncementType;
	ttl? : number;
	names? : Array<SpecialName>
}

export type DialogValue = number|string;
export type DialogMsg = {
	type : DialogType;
	onSubmit? : (submitMsg : DialogSubmitMsg) => void;
}
export type DialogSubmitMsg = {
	data : Map<number, DialogValue>;
}

export type NewClientMsg = {
	gameId : number;
	displayName : string;
	isSelf : boolean;
}

export type TooltipMsg = {
	type : TooltipType;
	ttl? : number;
	names? : Array<SpecialName>
}