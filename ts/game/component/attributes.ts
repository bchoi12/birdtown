
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { AttributeType, ComponentType } from 'game/component/api'

import { Optional } from 'util/optional'

export type AttributesInitOptions = {
	attributes? : Map<AttributeType, boolean>;
}

type AttributeMeta = {
	lastChange : Optional<number>;
}

export class Attributes extends ComponentBase implements Component {

	private _attributes : Map<AttributeType, boolean>;
	private _meta : Map<AttributeType, AttributeMeta>;

	constructor(init? : AttributesInitOptions) {
		super(ComponentType.ATTRIBUTES);

		this._attributes = new Map();
		this._meta = new Map();

		if (init && init.attributes) {
			init.attributes.forEach((value, key) => {
				this.setAttribute(key, value);
			})
		}

		for (const stringAttribute in AttributeType) {
			const type = Number(AttributeType[stringAttribute]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			this.addProp<boolean>({
				has: () => { return this.hasAttribute(type); },
				export: () => { return this.getAttribute(type); },
				import: (obj : boolean) => { this.setAttribute(type, obj); },
			})
		}
	}

	hasAttribute(type : AttributeType) : boolean { return this._attributes.has(type); }
	getAttribute(type : AttributeType) : boolean {
		if (!this.hasAttribute(type)) {
			return false;
		}
		return this._attributes.get(type);
	}
	setAttribute(type : AttributeType, value : boolean) : void {
		if (this.hasAttribute(type) && this.getAttribute(type) === value) {
			return;
		}

		this._attributes.set(type, value);
		this.meta(type).lastChange.set(Date.now());
	}

	lastChange(type : AttributeType) : Optional<number> {
		return this.meta(type).lastChange;
	}

	private meta(type : AttributeType) : AttributeMeta {
		if (!this._meta.has(type)) {
			this._meta.set(type, {
				lastChange: new Optional(),
			});
		}

		return this._meta.get(type);
	}
}