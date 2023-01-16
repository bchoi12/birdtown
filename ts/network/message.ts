
export enum MessageType {
	UNKNOWN,
	GAME,
	INIT_CLIENT,
	PING,
}

// TODO: actual message class
export interface Message {
	T : number;

	// Id
	I? : number;
	
	// Name
	N? : string;

	// Sequence number
	S? : number;

	// Data
	D? : Object;
}