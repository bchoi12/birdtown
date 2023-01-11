
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'

import { Data, DataFilter, DataMap } from 'network/data'

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

enum Type {
	UNKNOWN,
	BOOLEAN,
	INTEGER,
	NUMBER,
}

export type AttributesInitOptions = {
	attributes? : Map<Attribute, Value>;
}

type Value = boolean|number;

export class Attributes extends ComponentBase implements Component {

	private static readonly _attributeTypes = new Map<Attribute, Type>([
		[Attribute.CAN_DOUBLE_JUMP, Type.BOOLEAN],
		[Attribute.DEAD, Type.BOOLEAN],
		[Attribute.GROUNDED, Type.BOOLEAN],
		[Attribute.SOLID, Type.BOOLEAN],
		[Attribute.READY, Type.BOOLEAN],

		[Attribute.OWNER, Type.INTEGER],
	]);

	private _attributes : Map<Attribute, Value>;

	constructor(options? : AttributesInitOptions) {
		super(ComponentType.ATTRIBUTES);

		this.setName({ base: "attributes" });

		this._attributes = new Map();

		if (options && options.attributes) {
			options.attributes.forEach((value, key) => {
				this.set(key, value);
			})
		}

		for (const stringAttribute in Attribute) {
			const attribute = Number(Attribute[stringAttribute]);
			if (Number.isNaN(attribute) || attribute <= 0) {
				continue;
			}

			this.registerProp(attribute, {
				has: () => { return this.has(attribute); },
				export: () => { return this.get(attribute); },
				import: (obj : Object) => { this.set(attribute, <Value>obj); },
			})
		}
	}

	override ready() : boolean { return true; }

	has(attribute : Attribute) : boolean { return this._attributes.has(attribute); }
	get(attribute : Attribute) : Value { return this._attributes.get(attribute); }
	getOrDefault(attribute : Attribute) : Value {
		if (!this.has(attribute)) {
			switch(Attributes._attributeTypes.get(attribute)) {
			case Type.BOOLEAN:
				return false;
			case Type.INTEGER:
			case Type.NUMBER:
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

		this._attributes.set(attribute, value);
	}

	setIf(attribute : Attribute, value : Value, set : boolean) : void {
		if (!set) {
			return;
		}

		this.set(attribute, value);
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

	private validValue(attribute : Attribute, value : Value) : boolean {
		if (!Attributes._attributeTypes.has(attribute)) {
			console.error("No attribute mapping for attribute " + attribute);
			return false;
		}

		const prop = Attributes._attributeTypes.get(attribute);
		switch(prop) {
		case Type.BOOLEAN:
			return typeof(value) === "boolean";
		case Type.INTEGER:
			return Number.isInteger(value);
		case Type.NUMBER:
			return !Number.isNaN(value);
		default:
			return false;
		}

	}
}