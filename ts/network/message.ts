export enum MessageType {
	UNKNOWN,
	CHAT,
	GAME,
	INIT_CLIENT,
	PING,
}

export type IncomingMessage = {
	name : string;
	id : number;
	msg : Message;
}

// TODO: actual message class
export interface Message {
	T : number;

	// Sequence number
	S? : number;

	// Data
	D? : Object;
}