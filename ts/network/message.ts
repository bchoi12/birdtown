
export enum MessageType {
	UNKNOWN = 0,
	NEW_CLIENT = 1,
	ENTITY = 2,
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