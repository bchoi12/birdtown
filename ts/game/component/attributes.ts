
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'

import { defined } from 'util/common'

export enum Attribute {
	UNKNOWN,

	// Boolean
	GROUNDED,
	READY,
	SOLID,

	// Integer
	OWNER,
	TEAM,
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
		[Attribute.GROUNDED, Type.BOOLEAN],
		[Attribute.SOLID, Type.BOOLEAN],
		[Attribute.READY, Type.BOOLEAN],

		[Attribute.OWNER, Type.INTEGER],
		[Attribute.TEAM, Type.INTEGER],
	]);

	private _attributes : Map<Attribute, Value>;

	constructor(init : AttributesInitOptions) {
		super(ComponentType.ATTRIBUTES);

		if (!defined(init)) { init = {}; }
		this.setName({ base: "attributes" });

		this._attributes = new Map();

		if (init.attributes) {
			init.attributes.forEach((value, key) => {
				this.set(key, value);
			})
		}

		for (const stringAttribute in Attribute) {
			const attribute = Number(Attribute[stringAttribute]);
			if (Number.isNaN(attribute) || attribute <= 0) {
				continue;
			}

			this.registerProp(attribute, {
				has: () => { return this.hasAttribute(attribute); },
				export: () => { return this.getAttribute(attribute); },
				import: (obj : Object) => { this.set(attribute, <Value>obj); },
			})
		}
	}

	hasAttribute(attribute : Attribute) : boolean { return this._attributes.has(attribute); }
	getAttribute(attribute : Attribute) : Value {
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

	set(attribute : Attribute, value : Value) : void {
		if (!this.validValue(attribute, value)) {
			console.error("Error: invalid attribute and value", attribute, value);
			return;
		}

		this._attributes.set(attribute, value);
	}

	negate(attribute : Attribute) : void {
		const current = this.getAttribute(attribute);

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
		if (Number.isNaN(value) || !this.isNumerical(attribute)) {
			console.error("Error: attribute cannot be incremented by value", attribute, value);
			return;
		}

		const current = <number>this.getAttribute(attribute);
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

	private isNumerical(attribute : Attribute) : boolean {
		return Attributes._attributeTypes.get(attribute) === Type.INTEGER || Attributes._attributeTypes.get(attribute) === Type.NUMBER;
	}
}