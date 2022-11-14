
export enum Prop {
	UNKNOWN,
	POS,
}

export class Data {

	private _props : Map<Prop, any>;
	private _seqNum : Map<Prop, any>;

	private _lastSeqNum : number;

	constructor() {
		this._props = new Map();
		this._seqNum = new Map();

		this._lastSeqNum = -1;
	}

	props() : Map<Prop, any> { return this._props; }
}