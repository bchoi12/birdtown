export enum MessageType {
	UNKNOWN,
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

	// Id
	I? : number;

	// Sequence number
	S? : number;

	// Data
	D? : Object;
}