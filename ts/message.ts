
import { MessageType } from 'message/api'

export interface Message<T extends number> {
	type() : MessageType;
	valid() : boolean;

	hasProp(prop : number);
	getProp<O extends Object>(prop : number) : O;
	setProp<O extends Object>(prop : number, obj : O) : void;

	parseObject(obj : Object) : Message<T>;
	toObject() : Object;
}

enum Prop {
	UNKNOWN,
	TYPE,
	DATA,
}

export type DataMap = { [k: number]: Object }
export abstract class MessageBase<T extends number> {
	protected _type : MessageType;
	protected _data : DataMap;

	constructor(type : MessageType) {
		this._type = type;
		this._data = {};
	}

	abstract descriptor() : Map<MessageType, Set<T>>;

	type() : MessageType { return this._type; }
	valid() : boolean {
		if (this._type === MessageType.UNKNOWN) {
			return false;
		}
		if (Object.keys(this._data).length === 0) {
			return false;
		}

		for (let prop of this.descriptor().get(this._type)) {
			if (!this.hasProp(prop)) {
				return false;
			}
		}
		return true;
	}

	hasProp(prop : T) : boolean {
		if (!this.descriptor().has(prop)) {
			return false;
		}
		return this._data.hasOwnProperty(prop);
	}
	getProp<O extends Object>(prop : T) : O {
		if (!this.descriptor().has(prop)) {
			console.error("Error: trying to get invalid prop %d for type %d", prop, this._type);
			return null;
		}
		return <O>this._data[prop];
	}
	setProp<O extends Object>(prop : T, obj : O) : Message<T> {
		if (!this.descriptor().has(prop)) {
			console.error("Error: skipping setting invalid prop %d for type %d", prop, this._type);
			return this;
		}

		this._data[prop] = obj;
		return this;
	}

	parseObject(obj : Object) : Message<T> {
		if (obj.hasOwnProperty(Prop.TYPE)) {
			this._type = <MessageType>obj[Prop.TYPE];
		}
		if (obj.hasOwnProperty(Prop.DATA)) {
			this._data = <DataMap>obj[Prop.DATA];
		}
		return this;
	}
	toObject() : Object {
		let obj = {};
		obj[Prop.TYPE] = this._type;
		obj[Prop.DATA] = this._data;
		return obj;
	}

	protected static setOf(...props : number[]) : Set<number> { return new Set(props); }
}