
import { Data, DataFilter, DataMap } from 'network/data'

import { defined } from 'util/common'

export namespace GameConstants {
	export const gravity = -0.85;
}

type HasFn = () => boolean;
type ExportFn = () => Object;
type ImportFn = (object : Object) => void;

export type PropFns = {
	has? : HasFn;
	export : ExportFn;
	import : ImportFn;
}

export type NameParams = {
	base : string;
	parent? : GameObject;
	target? : GameObject;
	type? : number;
	id? : number;
}

export interface GameObject {
	name() : string;
	setName(params : NameParams) : void;

	ready() : boolean;
	initialized() : boolean;
	initialize() : void;
	delete() : void;
	deleted() : boolean;
	dispose() : void;

	preUpdate(millis : number) : void
	update(millis : number) : void
	postUpdate(millis : number) : void
	prePhysics(millis : number) : void
	postPhysics(millis : number) : void
	preRender() : void
	postRender() : void

	registerProp(prop : number, propFns : PropFns);
	addChild<T extends GameObject>(id : number, child : T) : T;
	hasChild(id : number) : boolean;
	getChild<T extends GameObject>(id : number) : T;
	children() : Map<number, GameObject>;

	shouldBroadcast() : boolean;
	isSource() : boolean;
	data() : Data;
	dataMap(filter : DataFilter) : DataMap;
	updateData(seqNum : number) : void;
	importData(data : DataMap, seqNum : number) : void;
}

export abstract class GameObjectBase {
	protected _name : string;
	protected _initialized : boolean;
	protected _deleted : boolean;
	protected _data : Data;
	protected _propFns : Map<number, PropFns>;
	protected _childObjects : Map<number, GameObject>;

	constructor(name : string) {
		this._name = name;
		this._initialized = false;
		this._deleted = false;
		this._data = new Data();
		this._propFns = new Map();
		this._childObjects = new Map();
	}

	name() : string { return this._name; }
	setName(params : NameParams) {
		this._name = params.base;

		if (params.parent) {
			this._name = params.parent.name() + "/" + this._name;
		}

		if (params.type) {
			this._name += "-" + params.type;
		}

		if (params.id) {
			this._name += "," + params.id;
		}

		if (params.target) {
			this._name += "/" + params.target.name();
		}
	}

	abstract ready() : boolean;
	initialize() : void {
		this._childObjects.forEach((child : GameObject) => {
			child.initialize();
		});
		this._initialized = true;
	}
	initialized() : boolean {return this._initialized; }
	delete() : void {
		this._childObjects.forEach((child : GameObject) => {
			child.delete();
		});
		this._deleted = true;
	}
	deleted() : boolean { return this._deleted; }
	dispose() : void {
		this._childObjects.forEach((child : GameObject) => {
			child.dispose();
		});
	}

	preUpdate(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			child.preUpdate(millis);
		});
	}
	update(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			child.update(millis);
		});
	}
	postUpdate(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			child.postUpdate(millis);
		});
	}
	prePhysics(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			child.prePhysics(millis);
		});
	}
	postPhysics(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			child.postPhysics(millis);
		});
	}
	preRender() : void {
		this._childObjects.forEach((child : GameObject) => {
			child.preRender();
		});
	}
	postRender() : void {
		this._childObjects.forEach((child : GameObject) => {
			child.postRender();
		});
	}

	registerProp(prop : number, propFns : PropFns) : void {
		if (prop <= 0) {
			console.error("Error: invalid prop number %d for %s", prop, this.name());
			return;
		}
		if (this._propFns.has(prop)) {
			console.error("Error: skipping registration of duplicate prop %d for %s", prop, this.name());
			return;
		}
		if (this._childObjects.size > 0) {
			console.error("Error: all props must be registered before any child objects are added to %s", this.name());
			return;
		}

		this._data.registerProp(prop);
		this._propFns.set(prop, propFns);
	}
	addChild<T extends GameObject>(id : number, child : T) : T {
		if (id <= 0) {
			console.error("Error: invalid child object ID %d for %s", id, this.name());
			return;
		}
		if (this._childObjects.has(id)) {
			console.error("Error: skipping registration of duplicate child object %d for %s", id, this.name());
			return;
		}

		this._childObjects.set(id, child);
		return child;
	}
	hasChild(id : number) : boolean { return this._childObjects.has(id); }
	getChild<T extends GameObject>(id : number) : T { return <T>this._childObjects.get(id); }
	children() : Map<number, GameObject> { return this._childObjects; }

	abstract shouldBroadcast() : boolean;
	abstract isSource() : boolean;
	data() : Data { return this._data; }

	dataMap(filter : DataFilter) : DataMap {
		if (!this.shouldBroadcast()) {
			return {};
		}

		let data = this._data.filtered(filter);
		this._childObjects.forEach((child : GameObject, id : number) => {
			const prop = this.idToProp(id);

			const childData = child.dataMap(filter);
			if (Object.keys(childData).length > 0) {
				data[prop] = childData;
			}
		});
		return data;
	}

	updateData(seqNum : number) : void {
		if (!this.shouldBroadcast()) {
			return;
		}

		this._propFns.forEach((fns : PropFns, prop : number) => {
			if (!defined(fns.has) || fns.has()) {
				this.setProp(prop, fns.export(), seqNum);
			}
		});

		this._childObjects.forEach((child : GameObject, id : number) => {
			child.updateData(seqNum);
		});
	}

	importData(data : DataMap, seqNum : number) : void {
		// TODO: this is pretty messy, but update if it's child object data or if we're not the source
		const changed = this._data.import(data, seqNum, (prop : number) => { return (prop > this.numProps()) || !this.isSource(); });

		changed.forEach((prop : number) => {
			if (this._propFns.has(prop)) {
				this._propFns.get(prop).import(this._data.get(prop));
			} else {
				const id = this.propToId(prop);
				if (this._childObjects.has(id)) {
					this._childObjects.get(id).importData(<DataMap>this._data.get(prop), seqNum);
				} else {
					console.error("Warning: missing handler for prop %d (or id %d) for %s", prop, id, this.name());
				}
			}
		});
	}

	protected idToProp(id : number) : number { return id + this.numProps(); }
	protected propToId(prop : number) : number { return prop - this.numProps(); }

	protected numProps() : number { return this._propFns.size; }
	protected setProp(prop : number, data : Object, seqNum : number, cb? : () => boolean) : boolean {
		if (this.isSource()) {
			return this._data.set(prop, data, seqNum, () => {
				return defined(cb) ? cb() : true;
			});
		}
		return false;
	}
}