
import { Message, MessageBase, MessageObject, FieldDescriptor, DataMap } from 'message'

export enum NetworkMessageType {
	UNKNOWN,

	CHAT,
	GAME,
	INCOMING,
	INIT_CLIENT,
	PING,
	VOICE,
	VOICE_MAP,
}

enum NetworkProp {
	UNKNOWN,
	CHAT_MESSAGE,
	CLIENT_ID,
	CLIENT_MAP,
	DATA,
	SEQ_NUM,
	VOICE_ENABLED,
}

export class NetworkMessage extends MessageBase<NetworkMessageType, NetworkProp> implements Message<NetworkMessageType, NetworkProp> {

	private static readonly _messageDescriptor = new Map<NetworkMessageType, FieldDescriptor>([
		[NetworkMessageType.CHAT, MessageBase.fields(
			NetworkProp.CHAT_MESSAGE)],
		[NetworkMessageType.GAME, MessageBase.fields(
			NetworkProp.SEQ_NUM,
			NetworkProp.DATA)],
		[NetworkMessageType.INIT_CLIENT, MessageBase.fields(
			NetworkProp.CLIENT_ID)],
		[NetworkMessageType.PING, MessageBase.fields(
			NetworkProp.SEQ_NUM)],
		[NetworkMessageType.VOICE, MessageBase.fields(
			NetworkProp.CLIENT_ID,
			NetworkProp.VOICE_ENABLED)],
		[NetworkMessageType.VOICE_MAP, MessageBase.fields(
			NetworkProp.CLIENT_MAP)],
	]);

	private _name : string;
	private _id : number;

	constructor(type : NetworkMessageType) {
		super(type);
		this._name = "";
		this._id = 0;
	}

	override debugName() : string { return "NetworkMessage"; }
	override messageDescriptor() : Map<NetworkMessageType, FieldDescriptor> { return NetworkMessage._messageDescriptor; }
	override valid() { return super.valid() && this._name.length > 0; }

	name() : string { return this._name; }
	setName(name : string) : void { this._name = name; }
	id() : number { return this._id; }
	setId(id : number) : void { this._id = id; }

    // Begin auto-generated code (v2.1)
    override serializable() { return true; }

    hasChatMessage() : boolean { return this.has(NetworkProp.CHAT_MESSAGE); }
    getChatMessage() : string { return this.get<string>(NetworkProp.CHAT_MESSAGE); }
    getChatMessageOr(value : string) : string { return this.getOr<string>(NetworkProp.CHAT_MESSAGE, value); }
    setChatMessage(value : string) : void { this.set<string>(NetworkProp.CHAT_MESSAGE, value); }

    hasClientId() : boolean { return this.has(NetworkProp.CLIENT_ID); }
    getClientId() : number { return this.get<number>(NetworkProp.CLIENT_ID); }
    getClientIdOr(value : number) : number { return this.getOr<number>(NetworkProp.CLIENT_ID, value); }
    setClientId(value : number) : void { this.set<number>(NetworkProp.CLIENT_ID, value); }

    hasClientMap() : boolean { return this.has(NetworkProp.CLIENT_MAP); }
    getClientMap() : Object { return this.get<Object>(NetworkProp.CLIENT_MAP); }
    getClientMapOr(value : Object) : Object { return this.getOr<Object>(NetworkProp.CLIENT_MAP, value); }
    setClientMap(value : Object) : void { this.set<Object>(NetworkProp.CLIENT_MAP, value); }

    hasData() : boolean { return this.has(NetworkProp.DATA); }
    getData() : DataMap { return this.get<DataMap>(NetworkProp.DATA); }
    getDataOr(value : DataMap) : DataMap { return this.getOr<DataMap>(NetworkProp.DATA, value); }
    setData(value : DataMap) : void { this.set<DataMap>(NetworkProp.DATA, value); }

    hasSeqNum() : boolean { return this.has(NetworkProp.SEQ_NUM); }
    getSeqNum() : number { return this.get<number>(NetworkProp.SEQ_NUM); }
    getSeqNumOr(value : number) : number { return this.getOr<number>(NetworkProp.SEQ_NUM, value); }
    setSeqNum(value : number) : void { this.set<number>(NetworkProp.SEQ_NUM, value); }

    hasVoiceEnabled() : boolean { return this.has(NetworkProp.VOICE_ENABLED); }
    getVoiceEnabled() : boolean { return this.get<boolean>(NetworkProp.VOICE_ENABLED); }
    getVoiceEnabledOr(value : boolean) : boolean { return this.getOr<boolean>(NetworkProp.VOICE_ENABLED, value); }
    setVoiceEnabled(value : boolean) : void { this.set<boolean>(NetworkProp.VOICE_ENABLED, value); }

    /*
    const enumClass = "NetworkProp";
    ["CHAT_MESSAGE", "string"],
    ["CLIENT_ID", "number"],
    ["CLIENT_MAP", "Object"],
    ["DATA", "DataMap"],
    ["SEQ_NUM", "number"],
    ["VOICE_ENABLED", "boolean"],
    */
    // End auto-generated code (v2.1)
}