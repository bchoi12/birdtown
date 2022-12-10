
export enum MessageType {
	UNKNOWN,
	ENTITY,
	NEW_CLIENT,
	PING,
}

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