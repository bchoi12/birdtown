
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
	JUICE,
}

export enum DialogType {
	UNKNOWN,
	CHECK_READY,
}

export type DialogPage = {
	buttons : Array<DialogButton>;
}

export enum DialogButtonType {
	UNKNOWN,

	BACK,
	IMAGE,
	NEXT,
	SUBMIT,
}

export type DialogButton = {
	type : DialogButtonType;
	title : string;
	onSelect? : () => void;
	onUnselect? : () => void;
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