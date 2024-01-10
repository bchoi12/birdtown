
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { AttributeType, ComponentType } from 'game/component/api'

export type AttributesInitOptions = {
	attributes? : Map<AttributeType, boolean>;
}

export class Attributes extends ComponentBase implements Component {

	private _attributes : Map<AttributeType, boolean>;

	constructor(init? : AttributesInitOptions) {
		super(ComponentType.ATTRIBUTES);

		this._attributes = new Map();

		if (init && init.attributes) {
			init.attributes.forEach((value, key) => {
				this.setAttribute(key, value);
			})
		}

		for (const stringAttribute in AttributeType) {
			const attribute = Number(AttributeType[stringAttribute]);
			if (Number.isNaN(attribute) || attribute <= 0) {
				continue;
			}

			this.addProp<boolean>({
				has: () => { return this.hasAttribute(attribute); },
				export: () => { return this.getAttribute(attribute); },
				import: (obj : boolean) => { this.setAttribute(attribute, obj); },
			})
		}
	}

	hasAttribute(attribute : AttributeType) : boolean { return this._attributes.has(attribute); }
	getAttribute(attribute : AttributeType) : boolean {
		if (!this.hasAttribute(attribute)) {
			return false;
		}
		return this._attributes.get(attribute);
	}
	setAttribute(attribute : AttributeType, value : boolean) : void { this._attributes.set(attribute, value); }
}