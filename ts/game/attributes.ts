
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

export enum Attribute {
	UNKNOWN,

	GROUNDED,
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
		[Attribute.GROUNDED, Prop.BOOLEANS],
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

	set(attribute : Attribute, value : Value) : void {
		const prop = Attributes._attributeMapping.get(attribute);

		if (!this.validValue(prop, value)) {
			console.error("Error: tried to set attribute " + attribute + " to " + value);
			return;
		}

		if (!this._attributes.has(prop)) {
			this._attributes.set(prop, new Map<Attribute, Value>());
			this._attributeData.set(prop, new Data());
		}

		this._attributes.get(prop).set(attribute, value);
	}

	override ready() { return true; }

	override filteredData(filter : DataFilter) : DataMap {
		if (!this.authoritative()) {
			return {};
		}

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

	private validValue(prop : Prop, value : Value) : boolean {
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