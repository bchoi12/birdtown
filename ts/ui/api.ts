
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
	TEST,
}

export enum CounterType {
	UNKOWN,
	HEALTH,
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

export type DialogValue = number|string;
export type DialogMsg = {
	type : DialogType;
	onSubmit? : (submitMsg : DialogSubmitMsg) => void;
}
export type DialogSubmitMsg = {
	data : Map<number, DialogValue>;
}

export type TooltipMsg = {
	type : TooltipType;
	ttl? : number;
	names? : Array<SpecialName>
}