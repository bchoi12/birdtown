
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

export enum Attribute {
	UNKNOWN,

	// Boolean
	CAN_DOUBLE_JUMP,
	DEAD,
	GROUNDED,
	READY,
	SOLID,

	// Integer
	OWNER,
}

enum Prop {
	UNKNOWN,
	BOOLEANS,
	INTEGERS,
	NUMBERS,
}

type Value = boolean|number;

export class Attributes extends ComponentBase implements Component {

	private static readonly _props = [Prop.BOOLEANS, Prop.INTEGERS, Prop.NUMBERS];
	private static readonly _attributeMapping = new Map<Attribute, Prop>([
		[Attribute.CAN_DOUBLE_JUMP, Prop.BOOLEANS],
		[Attribute.DEAD, Prop.BOOLEANS],
		[Attribute.GROUNDED, Prop.BOOLEANS],
		[Attribute.SOLID, Prop.BOOLEANS],
		[Attribute.READY, Prop.BOOLEANS],

		[Attribute.OWNER, Prop.INTEGERS],
	]);

	private _attributes : Map<Prop, Map<Attribute, Value>>;
	private _attributeData : Map<Prop, Data>;

	constructor() {
		super(ComponentType.ATTRIBUTES);

		this._attributes = new Map();
		this._attributeData = new Map();
	}

	has(attribute : Attribute) : boolean {
		const prop = Attributes._attributeMapping.get(attribute);
		return this._attributes.has(prop) && this._attributes.get(prop).has(attribute);
	}

	get(attribute : Attribute) : Value {
		const prop = Attributes._attributeMapping.get(attribute);
		return this._attributes.get(prop).get(attribute);
	}

	getOrDefault(attribute : Attribute) : Value {
		if (!this.has(attribute)) {
			switch(Attributes._attributeMapping.get(attribute)) {
			case Prop.BOOLEANS:
				return false;
			case Prop.INTEGERS:
			case Prop.NUMBERS:
				return 0;
			}
		}
		return this.get(attribute);
	}

	set(attribute : Attribute, value : Value) : void {
		if (!this.validValue(attribute, value)) {
			console.error("Error: invalid attribute and value", attribute, value);
			return;
		}

		const prop = Attributes._attributeMapping.get(attribute);
		if (!this._attributes.has(prop)) {
			this._attributes.set(prop, new Map<Attribute, Value>());
			this._attributeData.set(prop, new Data());
		}

		this._attributes.get(prop).set(attribute, value);
	}

	negate(attribute : Attribute) : void {
		const current = this.get(attribute);

		if (typeof current === 'boolean') {
			this.set(attribute, !current);
		} else if (!Number.isNaN(current)) {
			this.set(attribute, -<number>current);
		} else {
			console.error("Error: could not negate " + attribute);
			return;
		}
	}

	add(attribute : Attribute, value : Value) : void {
		if (Number.isNaN(value) || !this.validValue(attribute, value)) {
			console.error("Error: attribute cannot be incremented by value", attribute, value);
			return;
		}

		const current = <number>this.get(attribute);
		this.set(attribute, current + <number>value);
	}

	override ready() { return true; }

	override filteredData(filter : DataFilter) : DataMap {
		let dataMap = {};
		Attributes._props.forEach((prop : Prop) => {
			if (!this._attributeData.has(prop)) {
				return;
			}

			const data = this._attributeData.get(prop).filtered(filter);
			if (Object.keys(data).length > 0) {
				dataMap[prop] = data;
			}
		});
		return dataMap;
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		Attributes._props.forEach((prop : Prop) => {
			if (!this._attributes.has(prop)) {
				return;
			}
			this._attributes.get(prop).forEach((value : Value, attribute : Attribute) => {
				this._attributeData.get(prop).update(attribute, value, seqNum);
			});
		});
	}

	override mergeData(data : DataMap, seqNum : number) : void {
		super.mergeData(data, seqNum);

		const changed = this._data.merge(data, seqNum);
		if (changed.size === 0) {
			return;
		}

		Attributes._props.forEach((prop : Prop) => {
			if (changed.has(prop)) {
				for (const [stringAttribute, value] of Object.entries(this._data.get(prop))) {
					this.set(Number(stringAttribute), value);
				}
			}
		});
	}

	private validValue(attribute : Attribute, value : Value) : boolean {
		if (!Attributes._attributeMapping.has(attribute)) {
			console.error("No attribute mapping for attribute " + attribute);
			return false;
		}

		const prop = Attributes._attributeMapping.get(attribute);
		switch(prop) {
		case Prop.BOOLEANS:
			return typeof(value) === "boolean";
		case Prop.INTEGERS:
			return Number.isInteger(value);
		case Prop.NUMBERS:
			return !Number.isNaN(value);
		default:
			return false;
		}

	}
}