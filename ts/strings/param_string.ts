
import { Strings } from 'strings'

export enum ParamType {
	UNKNOWN,

	COLOR,
}

export class ParamString {
	
	private _base : string;

	private _unfulfilled : Set<ParamType>;
	private _strings : Map<ParamType, string>;

	private constructor(base : string) {
		this._base = base;

		this._unfulfilled = null;
		this._strings = null;
	}

	static of(base : string) : ParamString {
		return new ParamString(base);
	}

	private base() : string { return this._base; }
	toString() : string {
		// TODO: add formatting or something
		return this._base;
	}
	toTitleString() : string {
		return Strings.toTitleCase(this.toString());
	}
	valid() : boolean { return this._unfulfilled === null || this._unfulfilled.size === 0; }

	require(specs : ParamType[]) : ParamString {
		for (let i = 0; i < specs.length; ++i) {
			this.addSpec(specs[i], true);
		}
		return this;
	}
	optional(specs : ParamType[]) : ParamString {
		for (let i = 0; i < specs.length; ++i) {
			this.addSpec(specs[i], false);
		}
		return this;
	}

	has(type : ParamType) : boolean { return this._strings !== null && this._strings.has(type); }
	set(type : ParamType, value : string) : ParamString {
		if (this._strings === null) {
			this._strings = new Map();
		}
		this._strings.set(type, value);

		if (this._unfulfilled !== null) {
			this._unfulfilled.delete(type);
		}
		return this;
	}
	get(type : ParamType) : string {
		if (this._strings === null || !this._strings.has(type)) {
			console.error("Error: missing strings for %s", ParamType[type]);
			return "";
		}
		return this._strings.get(type);
	}

	private addSpec(type : ParamType, required : boolean) : void {
		if (required) {
			if (this._unfulfilled === null) {
				this._unfulfilled = new Set();
			}
			if (this._strings === null || !this._strings.has(type)) {
				this._unfulfilled.add(type);
			}
		}
	}
}