
import { NetworkMessageType } from 'message/api'

export interface Message<T extends number, P extends number> {
	type() : T;
	valid() : boolean;

	hasProp(prop : P);
	getProp<O extends Object>(prop : P) : O;
	getPropOr<O extends Object>(prop : P, obj : O) : O;
	setProp<O extends Object>(prop : P, obj : O) : void;

	parseObject(obj : Object) : Message<T, P>;
	toObject() : Object;
}

enum Prop {
	UNKNOWN,
	TYPE,
	DATA,
}

export type Descriptor = {
	optional? : boolean;
};
export type FieldDescriptor = Map<number, Descriptor>;
export type DataMap = { [k: number]: Object }

export abstract class MessageBase<T extends number, P extends number> {
	protected _type : T;
	protected _data : DataMap;

	constructor(type : T) {
		this._type = type;
		this._data = {};

		if (this._type > 0 && !this.messageDescriptor().has(this._type)) {
			console.error("Error: messageDescriptor is missing type %d", this._type, this.messageDescriptor());
		}
	}

	abstract messageDescriptor() : Map<T, FieldDescriptor>;

	type() : T { return this._type; }
	valid() : boolean {
		if (this._type === 0) {
			return false;
		}
		if (Object.keys(this._data).length === 0) {
			return false;
		}

		for (let [prop, descriptor] of this.messageDescriptor().get(this._type)) {
			if (!this.hasProp(<P>prop) && !descriptor.optional) {
				return false;
			}
		}
		return true;
	}

	hasProp(prop : P) : boolean {
		if (!this.messageDescriptor().get(this._type).has(prop)) {
			return false;
		}
		return this._data.hasOwnProperty(prop);
	}
	getProp<O extends Object>(prop : P) : O {
		if (!this.messageDescriptor().get(this._type).has(prop)) {
			console.error("Error: trying to get invalid prop %d for type %d", prop, this._type);
			return null;
		}
		return <O>this._data[prop];
	}
	getPropOr<O extends Object>(prop : P, or : O) : O {
		if (!this.hasProp(prop)) {
			return or;
		}
		return this.getProp<O>(prop);
	}
	setProp<O extends Object>(prop : P, obj : O) : Message<T, P> {
		if (!this.messageDescriptor().get(this._type).has(prop)) {
			console.error("Error: skipping setting invalid prop %d for type %d", prop, this._type);
			return this;
		}

		this._data[prop] = obj;
		return this;
	}

	parseObject(obj : Object) : Message<T, P> {
		if (obj.hasOwnProperty(Prop.TYPE)) {
			this._type = <T>obj[Prop.TYPE];
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

	protected static fieldDescriptor(...fields : [number, Descriptor][]) : FieldDescriptor {
		let fieldDescriptor = new Map<number, Descriptor>();
		fields.forEach(([prop, descriptor] : [number, Descriptor]) => {
			fieldDescriptor.set(prop, descriptor);
		});
		return fieldDescriptor;
	}

	protected static fields(...fields : number[]) : FieldDescriptor {
		let fieldDescriptor = new Map<number, Descriptor>();
		fields.forEach((prop : number) => {
			fieldDescriptor.set(prop, {});
		});
		return fieldDescriptor;
	}
}