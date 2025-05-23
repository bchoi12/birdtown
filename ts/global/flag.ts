

abstract class Flag<T> {

	private _name : string;
	private _value : T;

	constructor(name : string, value : T) {
		this._name = name;
		this._value = value;

		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has(this._name)) {
			const param = urlParams.get(this._name);

			if (this.canConvert(param)) {
				this._value = this.convert(param);
			}
		}
	}

	name() : string { return this._name; }
	get() : T { return this._value; }
	canConvert(param : string) : boolean { return param.length > 0; }
	abstract convert(param : string) : T;
}

export class BoolFlag extends Flag<boolean>{

	constructor(name : string, value : boolean) {
		super(name, value);
	}

	override convert(param : string) {
		param = param.toLowerCase();

		if (param === "1" || param === "true") {
			return true;
		}
		return false;
	}
}

export class NumberFlag extends Flag<number>{

	constructor(name : string, value : number) {
		super(name, value);
	}

	override canConvert(param : string) : boolean {
		return !Number.isNaN(Number(param));
	}

	override convert(param : string) : number {
		return Number(param);
	}
}

export class StringFlag extends Flag<string>{

	constructor(name : string, value : string) {
		super(name, value);
	}

	override convert(param : string) : string {
		return param;
	}
}