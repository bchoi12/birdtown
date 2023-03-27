export enum MessageType {
	UNKNOWN,
	CHAT,
	GAME,
	INIT_CLIENT,
	PING,
	VOICE,
	VOICE_MAP,
}

export type Payload = {
	name : string;
	id : number;
	msg : Message;
}

export interface Message {
	T : MessageType;
	S? : number;
	D? : Object;
}
