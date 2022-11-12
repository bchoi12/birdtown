

export enum ComponentType {
	UNKNOWN,
	KEYS,
	PROFILE,
}

export interface Component {
	update(ts : number) : void

	// TODO: serialization methods
};