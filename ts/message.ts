
export interface Message<T extends number, P extends number> {
	type() : T;
	valid() : boolean;

	has(prop : P);
	get<O extends Object>(prop : P) : O;
	getOr<O extends Object>(prop : P, obj : O) : O;
	set<O extends Object>(prop : P, obj : O) : void;

	parseObject(obj : Object) : Message<T, P>;
	exportObject() : Object;
}

enum Prop {
	UNKNOWN,
	TYPE,
	DATA,
}

export type Descriptor = {
	optional? : boolean;
	min? : number;
};
export type FieldDescriptor = Map<number, Descriptor>;
export type DataMap = { [k: number]: Object }

export abstract class MessageBase<T extends number, P extends number> {
	protected _type : T;
	protected _data : DataMap;
	protected _updated : boolean;

	constructor(type : T) {
		this._type = type;
		this._data = {};
		this._updated = false;

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
			if (!this.has(<P>prop)) {
				if (!descriptor.optional) {
					return false;
				}
			} else {
				if (descriptor.min && this.get(<P>prop) < descriptor.min) {
					return false;
				}
			}
		}
		return true;
	}

	reset(type : T) : void {
		this._type = type;
		this.clear();
	}
	clear() : void { this._data = {}; }
	has(prop : P) : boolean {
		const descriptor = this.messageDescriptor().get(this._type);
		if (!descriptor.has(prop)) {
			return false;
		}
		return this._data.hasOwnProperty(prop);
	}
	get<O extends Object>(prop : P) : O {
		if (!this.messageDescriptor().get(this._type).has(prop)) {
			console.error("Error: trying to get invalid prop %d for type %d", prop, this._type);
			return null;
		}
		return <O>this._data[prop];
	}
	getOr<O extends Object>(prop : P, or : O) : O {
		if (!this.has(prop)) {
			return or;
		}
		return this.get<O>(prop);
	}
	set<O extends Object>(prop : P, obj : O) : Message<T, P> {
		if (!this.messageDescriptor().get(this._type).has(prop)) {
			console.error("Error: skipping setting invalid prop %d for type %d", prop, this._type);
			return this;
		}

		this._data[prop] = obj;
		return this;
	}
	merge(other : Message<T, P>) : Message<T, P> {
		if (this.type() !== other.type()) {
			console.error("Error: skipping attempt to merge messages with different types", this, other);
			return this;
		}

		const descriptor = this.messageDescriptor().get(this.type());
		descriptor.forEach((descriptor : Descriptor, prop : P) => {
			if (other.has(prop)) {
				this.set(prop, other.get(prop));
			}
		});
		return this;
	}	

	updated() : boolean { return this._updated; }
	setUpdated(updated : boolean) : void { this._updated = updated; }

	parseObject(obj : Object) : Message<T, P> {
		if (this._type === 0) {
			this._type = <T>(obj[Prop.TYPE]);
		} else if (this._type !== <T>(obj[Prop.TYPE])) {
			return this;
		}
		if (obj.hasOwnProperty(Prop.DATA)) {
			this._data = <DataMap>(obj[Prop.DATA]);
		} else {
			this._data = {};
		}
		return this;
	}

	parseObjectIf(obj : Object, predicate : (data : DataMap) => boolean) : Message<T, P> {
		if (!predicate(<DataMap>(obj[Prop.DATA]))) {
			return this;
		}

		return this.parseObject(obj);
	}

	dataMap() : DataMap { return this._data; }
	exportObject() : Object {
		this._updated = false;
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