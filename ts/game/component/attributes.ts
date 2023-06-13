
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { AttributeType, ComponentType } from 'game/component/api'

import { defined } from 'util/common'

export type AttributesInitOptions = {
	attributes? : Map<AttributeType, Value>;
}

enum Type {
	UNKNOWN,
	BOOLEAN,
	INTEGER,
	NUMBER,
}

// TODO: split boolean, int, number
type Value = boolean|number;

export class Attributes extends ComponentBase implements Component {

	private static readonly _attributeTypes = new Map<AttributeType, Type>([
		[AttributeType.BRAINED, Type.BOOLEAN],
		[AttributeType.GROUNDED, Type.BOOLEAN],
		[AttributeType.SOLID, Type.BOOLEAN],
		[AttributeType.READY, Type.BOOLEAN],

		[AttributeType.OWNER, Type.INTEGER],
		[AttributeType.TEAM, Type.INTEGER],
	]);

	private _attributes : Map<AttributeType, Value>;

	constructor(init : AttributesInitOptions) {
		super(ComponentType.ATTRIBUTES);

		if (!defined(init)) { init = {}; }
		this.setName({ base: "attributes" });

		this._attributes = new Map();

		if (init.attributes) {
			init.attributes.forEach((value, key) => {
				this.setAttribute(key, value);
			})
		}

		for (const stringAttribute in AttributeType) {
			const attribute = Number(AttributeType[stringAttribute]);
			if (Number.isNaN(attribute) || attribute <= 0) {
				continue;
			}

			this.registerProp(attribute, {
				has: () => { return this.hasAttribute(attribute); },
				export: () => { return this.getAttribute(attribute); },
				import: (obj : Object) => { this.setAttribute(attribute, <Value>obj); },
			})
		}
	}

	hasAttribute(attribute : AttributeType) : boolean { return this._attributes.has(attribute); }
	getAttribute(attribute : AttributeType) : Value {
		if (!this.hasAttribute(attribute)) {
			switch(Attributes._attributeTypes.get(attribute)) {
			case Type.BOOLEAN:
				return false;
			case Type.INTEGER:
			case Type.NUMBER:
				return 0;
			}
		}
		return this._attributes.get(attribute);
	}

	setAttribute(attribute : AttributeType, value : Value) : void {
		if (!this.validValue(attribute, value)) {
			console.error("Error: invalid attribute and value", attribute, value);
			return;
		}

		this._attributes.set(attribute, value);
	}

	negate(attribute : AttributeType) : void {
		const current = this.getAttribute(attribute);

		if (typeof current === 'boolean') {
			this.setAttribute(attribute, !current);
		} else if (!Number.isNaN(current)) {
			this.setAttribute(attribute, -<number>current);
		} else {
			console.error("Error: could not negate " + attribute);
			return;
		}
	}

	add(attribute : AttributeType, value : Value) : void {
		if (Number.isNaN(value) || !this.isNumerical(attribute)) {
			console.error("Error: attribute cannot be incremented by value", attribute, value);
			return;
		}

		const current = <number>this.getAttribute(attribute);
		this.setAttribute(attribute, current + <number>value);
	}

	private validValue(attribute : AttributeType, value : Value) : boolean {
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

	private isNumerical(attribute : AttributeType) : boolean {
		return Attributes._attributeTypes.get(attribute) === Type.INTEGER || Attributes._attributeTypes.get(attribute) === Type.NUMBER;
	}
}