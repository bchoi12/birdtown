
import { Message, MessageBase, FieldDescriptor } from 'message'

export enum UiMessageType {
	UNKNOWN,

	ANNOUNCEMENT,
	CLIENT,
	COUNTER,
	DIALOG,
	TOOLTIP,
}

export enum UiProp {
	UNKNOWN,
	CLIENT_ID,
	COUNT,
	DATA,
	DISPLAY_NAME,
	NAMES,
	ON_SUBMIT,
	PAGES,
	TYPE,
	TTL,
}

export class UiMessage extends MessageBase<UiMessageType, UiProp> implements Message<UiMessageType, UiProp> {

	private static readonly _messageDescriptor = new Map<UiMessageType, FieldDescriptor>([
		[UiMessageType.ANNOUNCEMENT, MessageBase.fieldDescriptor(
			[UiProp.TYPE, {}],
			[UiProp.TTL, {optional: true}],
			[UiProp.NAMES, {optional: true}],
		)],
		[UiMessageType.CLIENT, MessageBase.fieldDescriptor(
			[UiProp.CLIENT_ID, {}],
			[UiProp.DISPLAY_NAME, {}],
		)],
		[UiMessageType.COUNTER, MessageBase.fieldDescriptor(
			[UiProp.TYPE, {}],
			[UiProp.COUNT, {}],
		)],
		[UiMessageType.DIALOG, MessageBase.fieldDescriptor(
			[UiProp.TYPE, {}],
			[UiProp.PAGES, {optional: true}],
			[UiProp.ON_SUBMIT, {optional: true}],
		)],
		[UiMessageType.TOOLTIP, MessageBase.fieldDescriptor(
			[UiProp.TYPE, {}],
			[UiProp.TTL, {optional: true}],
			[UiProp.NAMES, {optional: true}],
		)],
	]);

	constructor(type : UiMessageType) { super(type); }
	override messageDescriptor() : Map<UiMessageType, FieldDescriptor> { return UiMessage._messageDescriptor; }
}