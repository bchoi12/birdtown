
import { Message, MessageBase, FieldDescriptor } from 'message'

export enum UiMessageType {
	UNKNOWN,

	ANNOUNCEMENT,
	DIALOG,
	TOOLTIP,
}

export enum UiProp {
	UNKNOWN,
	DATA,
	NAMES,
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
		[UiMessageType.DIALOG, MessageBase.fieldDescriptor(
			[UiProp.TYPE, {}],
			[UiProp.DATA, {optional: true}],
		)],
		[UiMessageType.TOOLTIP, MessageBase.fieldDescriptor(
			[UiProp.TYPE, {}],
			[UiProp.TTL, {optional: true}],
			[UiProp.NAMES, {optional: true}],
		)],
	]);

	constructor(type : UiMessageType) {
		super(type);
	}

	override messageDescriptor() : Map<UiMessageType, FieldDescriptor> { return UiMessage._messageDescriptor; }
}