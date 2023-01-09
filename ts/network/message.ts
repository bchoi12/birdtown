
export enum MessageType {
	UNKNOWN,
	ENTITY,
	INPUT,
	NEW_CLIENT,
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