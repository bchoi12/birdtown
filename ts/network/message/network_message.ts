
import { Message, MessageBase } from 'network/message'
import { MessageType } from 'network/message/api'

export enum NetworkProp {
	UNKNOWN,
	CLIENT_ID,
	CLIENT_MAP,
	DATA,
	ENABLED,
	SEQ_NUM,
	STRING,
}

export class NetworkMessage extends MessageBase implements Message {

	private static readonly _messageProps = new Map<MessageType, Set<NetworkProp>>([
		[MessageType.CHAT, NetworkMessage.setOf(
			NetworkProp.STRING)],
		[MessageType.GAME, NetworkMessage.setOf(
			NetworkProp.SEQ_NUM,
			NetworkProp.DATA)],
		[MessageType.INIT_CLIENT, NetworkMessage.setOf(
			NetworkProp.CLIENT_ID)],
		[MessageType.PING, NetworkMessage.setOf(
			NetworkProp.SEQ_NUM)],
		[MessageType.VOICE, NetworkMessage.setOf(
			NetworkProp.CLIENT_ID,
			NetworkProp.ENABLED)],
		[MessageType.VOICE_MAP, NetworkMessage.setOf(
			NetworkProp.CLIENT_MAP)],
	]);

	private _name : string;

	constructor(type : MessageType) {
		super(type);
		this._name = "";
	}

	// TODO: also validate props
	override valid() { return super.valid() && NetworkMessage._messageProps.has(this._type) && this._name.length > 0; }
	override parseObject(obj : Object) : NetworkMessage {
		super.parseObject(obj);
		return this;
	}

	hasProp(prop : NetworkProp) : boolean {
		if (!NetworkMessage._messageProps.get(this._type).has(prop)) {
			return false;
		}
		return super.hasProp(prop);
	}
	getProp<T extends Object>(prop : NetworkProp) : T {
		if (!NetworkMessage._messageProps.get(this._type).has(prop)) {
			console.error("Error: trying to get invalid prop %d for type %d", prop, this._type);
			return null;
		}

		return super.getProp(prop);
	}
	setProp<T extends Object>(prop : NetworkProp, obj : T) : NetworkMessage {
		if (!NetworkMessage._messageProps.get(this._type).has(prop)) {
			console.error("Error: trying to set invalid prop %d for type %d", prop, this._type);
			return this;
		}

		super.setProp<T>(prop, obj);
		return this;
	}

	name() : string { return this._name; }
	setName(name : string) : void { this._name = name; }

	private static setOf(...props : NetworkProp[]) : Set<NetworkProp> { return new Set(props); }
}