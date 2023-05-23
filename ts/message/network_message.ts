
import { Message, MessageBase, FieldDescriptor } from 'message'
import { NetworkMessageType } from 'message/api'

export enum NetworkProp {
	UNKNOWN,
	CLIENT_ID,
	CLIENT_MAP,
	DATA,
	ENABLED,
	SEQ_NUM,
	STRING,
}

export class NetworkMessage extends MessageBase<NetworkMessageType, NetworkProp> implements Message<NetworkMessageType, NetworkProp> {

	private static readonly _messageDescriptor = new Map<NetworkMessageType, FieldDescriptor>([
		[NetworkMessageType.CHAT, MessageBase.fields(
			NetworkProp.STRING)],
		[NetworkMessageType.GAME, MessageBase.fields(
			NetworkProp.SEQ_NUM,
			NetworkProp.DATA)],
		[NetworkMessageType.INIT_CLIENT, MessageBase.fields(
			NetworkProp.CLIENT_ID)],
		[NetworkMessageType.PING, MessageBase.fields(
			NetworkProp.SEQ_NUM)],
		[NetworkMessageType.VOICE, MessageBase.fields(
			NetworkProp.CLIENT_ID,
			NetworkProp.ENABLED)],
		[NetworkMessageType.VOICE_MAP, MessageBase.fields(
			NetworkProp.CLIENT_MAP)],
	]);

	private _name : string;

	constructor(type : NetworkMessageType) {
		super(type);
		this._name = "";
	}

	override messageDescriptor() : Map<NetworkMessageType, FieldDescriptor> { return NetworkMessage._messageDescriptor; }
	override valid() { return super.valid() && this._name.length > 0; }

	name() : string { return this._name; }
	setName(name : string) : void { this._name = name; }
}