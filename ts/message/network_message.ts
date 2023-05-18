
import { Message, MessageBase } from 'message'
import { MessageType } from 'message/api'

export enum NetworkProp {
	UNKNOWN,
	CLIENT_ID,
	CLIENT_MAP,
	DATA,
	ENABLED,
	SEQ_NUM,
	STRING,
}

export class NetworkMessage extends MessageBase<NetworkProp> implements Message<NetworkProp> {

	private static readonly _descriptor = new Map<MessageType, Set<NetworkProp>>([
		[MessageType.CHAT, MessageBase.setOf(
			NetworkProp.STRING)],
		[MessageType.GAME, MessageBase.setOf(
			NetworkProp.SEQ_NUM,
			NetworkProp.DATA)],
		[MessageType.INIT_CLIENT, MessageBase.setOf(
			NetworkProp.CLIENT_ID)],
		[MessageType.PING, MessageBase.setOf(
			NetworkProp.SEQ_NUM)],
		[MessageType.VOICE, MessageBase.setOf(
			NetworkProp.CLIENT_ID,
			NetworkProp.ENABLED)],
		[MessageType.VOICE_MAP, MessageBase.setOf(
			NetworkProp.CLIENT_MAP)],
	]);

	private _name : string;

	constructor(type : MessageType) {
		super(type);
		this._name = "";
	}

	override descriptor() : Map<MessageType, Set<NetworkProp>> { return NetworkMessage._descriptor; }
	override valid() { return super.valid() && this._name.length > 0; }

	name() : string { return this._name; }
	setName(name : string) : void { this._name = name; }
}