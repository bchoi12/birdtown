
import { Message, MessageBase } from 'message'
import { MessageType } from 'message/api'

export enum UiProp {
	UNKNOWN,
	DATA,
	NAMES,
	TYPE,
	TTL,
}

export class UiMessage extends MessageBase<UiProp> implements Message<UiProp> {

	private static readonly _descriptor = new Map<MessageType, Set<UiProp>>([
	]);

	constructor(type : MessageType) {
		super(type);
	}

	override descriptor() : Map<MessageType, Set<UiProp>> { return UiMessage._descriptor; }
}