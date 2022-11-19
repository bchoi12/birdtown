
export enum MessageType {
	UNKNOWN = 0,
	ENTITY = 1,
}

export interface Message {
	T : number;
	
	// Sequence number
	S? : number;

	// Data
	D? : Object;
}