
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
	LEVEL,
	DISCONNECTED,
	DISCONNECTED_SIGNALING,
}

export enum CounterType {
	UNKOWN,
	HEALTH,
	JUICE,
	ROCKET,
}

export enum DialogType {
	UNKNOWN,
	PICK_LOADOUT,
	PICK_GAME_MODE,
}

export type DialogPage = {
	buttons : Array<DialogButton>;
}

export enum DialogButtonType {
	UNKNOWN,
	IMAGE,
}

export enum DialogButtonAction {
	UNKNOWN,
	NONE,
	UNSELECT_GROUP,
	SUBMIT,
}

export type DialogButtonOnSelectFn = () => void
export type DialogButtonOnUnselectFn = () => void;
export type DialogButton = {
	type : DialogButtonType;
	title : string;
	action : DialogButtonAction;
	onSelect? : DialogButtonOnSelectFn;
	onUnselect? : DialogButtonOnUnselectFn;
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
	CONSOLE,
	SPECTATING,
}