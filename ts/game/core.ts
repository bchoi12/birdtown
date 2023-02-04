
import { Data, DataFilter, DataMap, PropParams } from 'network/data'

import { defined } from 'util/common'

export namespace GameConstants {
	export const gravity = -0.85;
}

type HasFn = () => boolean;
type ExportFn = () => Object;
type ImportFn = (object : Object) => void;

export type PropHandler = {
	preImport? : ImportFn;
	has? : HasFn;
	export : ExportFn;
	import : ImportFn;
	filters? : Set<DataFilter>;
}

export type NameParams = {
	base : string;
	parent? : GameObject;
	target? : GameObject;
	type? : number;
	id? : number;
}

export type FactoryFn = (id : number) => void

type DataBuffer = {
	seqNum : number;
	dataMap : DataMap;
}

export interface GameObject {
	name() : string;
	setName(params : NameParams) : void;

	ready() : boolean;
	initialized() : boolean;
	initialize() : void;
	reset() : void;
	delete() : void;
	deleted() : boolean;
	dispose() : void;

	preUpdate(millis : number) : void
	update(millis : number) : void
	postUpdate(millis : number) : void
	prePhysics(millis : number) : void
	physics(millis : number) : void
	postPhysics(millis : number) : void
	preRender(millis : number) : void
	render(millis : number) : void
	postRender(millis : number) : void

	millisSinceUpdate() : number;
	millisSinceImport() : number;

	registerProp(prop : number, params : PropHandler);
	setFactoryFn(factoryFn : FactoryFn) : void;
	addChild<T extends GameObject>(id : number, child : T) : T;
	hasChild(id : number) : boolean;
	getChild<T extends GameObject>(id : number) : T;
	unregisterChild(id : number) : void;
	getChildren() : Map<number, GameObject>;

	shouldBroadcast() : boolean;
	isSource() : boolean;
	data() : Data;
	dataMap(filter : DataFilter) : [DataMap, boolean];
	updateData(seqNum : number) : void;
	importData(data : DataMap, seqNum : number) : void;
}

export abstract class GameObjectBase {
	protected _name : string;
	protected _initialized : boolean;
	protected _deleted : boolean;
	protected _lastUpdateTime : number;
	protected _lastImportTime : number;

	protected _data : Data;
	protected _propHandlers : Map<number, PropHandler>;
	protected _preImportFns : Map<number, ImportFn>;
	protected _childObjects : Map<number, GameObject>;
	protected _dataBuffers : Map<number, Array<DataBuffer>>;

	protected _factoryFn : FactoryFn;


	constructor(name : string) {
		this._name = name;
		this._initialized = false;
		this._deleted = false;
		this._lastUpdateTime = Date.now();
		this._lastImportTime = Date.now();

		this._data = new Data();
		this._preImportFns = new Map();
		this._propHandlers = new Map();
		this._childObjects = new Map();

		this._dataBuffers = new Map();
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
			this._name += "[" + params.id + "]";
		}

		if (params.target) {
			this._name += ":" + params.target.name();
		}
	}

	abstract ready() : boolean;
	initialize() : void {
		if (this._initialized) {
			return;
		}
		this._initialized = true;
	}
	initialized() : boolean {return this._initialized; }
	reset() : void {
		this._childObjects.forEach((child : GameObject) => {
			child.reset();
		});
	}
	delete() : void {
		if (this._deleted) {
			return;
		}

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
		this._lastUpdateTime = Date.now();

		this._childObjects.forEach((child : GameObject) => {
			if (!child.initialized() && child.ready()) {
				child.initialize();
			}

			if (child.deleted()) {
				child.dispose();
			}

			if (child.initialized()) {
				child.preUpdate(millis);
			}
		});
	}
	update(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			if (child.initialized()) {
				child.update(millis);
			}
		});
	}
	postUpdate(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			if (child.initialized()) {
				child.postUpdate(millis);
			}
		});
	}
	prePhysics(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			if (child.initialized()) {
				child.prePhysics(millis);
			}
		});
	}
	physics(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			if (child.initialized()) {
				child.physics(millis);
			}
		});
	}
	postPhysics(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			if (child.initialized()) {
				child.postPhysics(millis);
			}
		});
	}
	preRender(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			if (child.initialized()) {
				child.preRender(millis);
			}
		});
	}
	render(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			if (child.initialized()) {
				child.render(millis);
			}
		});
	}
	postRender(millis : number) : void {
		this._childObjects.forEach((child : GameObject) => {
			if (child.initialized()) {
				child.postRender(millis);
			}
		});
	}

	millisSinceUpdate() : number { return Date.now() - this._lastUpdateTime; }
	millisSinceImport() : number { return Date.now() - this._lastImportTime; }

	registerProp(prop : number, propHandler : PropHandler) : void {
		if (prop <= 0) {
			console.error("Error: invalid prop number %d for %s", prop, this.name());
			return;
		}
		if (this._propHandlers.has(prop)) {
			console.error("Error: skipping registration of duplicate prop %d for %s", prop, this.name());
			return;
		}
		if (this.initialized()) {
			console.error("Error: all props must be registered during construction for %s", this.name());
			return;
		}

		this._data.registerProp(prop, {
			leaf: true,
			filters: defined(propHandler.filters) ? propHandler.filters : Data.allFilters,
		});
		if (propHandler.preImport) {
			this._preImportFns.set(prop, propHandler.preImport);
		}
		this._propHandlers.set(prop, propHandler);
	}

	setFactoryFn(factoryFn : FactoryFn) : void { this._factoryFn = factoryFn; }
	addChild<T extends GameObject>(id : number, child : T) : T {
		if (id <= 0) {
			console.error("Error: invalid child object ID %d for %s", id, this.name());
			return;
		}
		if (this._childObjects.has(id)) {
			console.error("Error: skipping registration of duplicate child object %d for %s", id, this.name());
			return;
		}

		if (this._dataBuffers.has(id)) {
			this._dataBuffers.get(id).forEach((buffer) => {
				child.importData(buffer.dataMap, buffer.seqNum);
			});
			this._dataBuffers.delete(id);
		}

		this._childObjects.set(id, child);
		return child;
	}
	hasChild(id : number) : boolean { return this._childObjects.has(id); }
	getChild<T extends GameObject>(id : number) : T { return <T>this._childObjects.get(id); }
	unregisterChild(id : number) : void {
		if (!this.hasChild(id)) {
			return;
		}
		this._childObjects.delete(id);
	}
	getChildren() : Map<number, GameObject> { return this._childObjects; }

	// TODO: replace with default NetworkBehavior (SOURCE, RELAY, COPY)
	// can replace default network behavior on a prop level
	abstract shouldBroadcast() : boolean;
	abstract isSource() : boolean;
	data() : Data { return this._data; }

	dataMap(filter : DataFilter) : [DataMap, boolean] {
		let [data, hasData] = this.shouldBroadcast() ? this._data.filtered(filter) : [{}, false];

		this._childObjects.forEach((child : GameObject, id : number) => {
			const prop = this.idToProp(id);

			const [childData, childHasData] = child.dataMap(filter);
			if (childHasData) {
				data[prop] = childData;
				hasData = true;
			}
		});

		return [data, hasData];
	}

	updateData(seqNum : number) : void {
		if (this.isSource()) {
			this._propHandlers.forEach((fns : PropHandler, prop : number) => {
				if (!defined(fns.has) || fns.has()) {
					this.setProp(prop, fns.export(), seqNum);
				}
			});
		}

		this._childObjects.forEach((child : GameObject, id : number) => {
			child.updateData(seqNum);
		});
	}

	importData(data : DataMap, seqNum : number) : void {
		this._lastImportTime = Date.now();

		this._preImportFns.forEach((fn : ImportFn, prop : number) => {
			if (data.hasOwnProperty(prop)) {
				fn(data[prop]);
			}
		});

		// TODO: this is pretty messy, but update if it's child object data or if we're not the source
		const changed = this._data.import(data, seqNum, (prop : number) => { return (prop > this.numProps()) || !this.isSource(); });

		changed.forEach((prop : number) => {
			if (this._propHandlers.has(prop)) {
				this._propHandlers.get(prop).import(this._data.get(prop).data);
			} else {
				const id = this.propToId(prop);
				if (!this._childObjects.has(id)) {
					if (defined(this._factoryFn)) {
						this._factoryFn(id);
					} else {
						if (!this._dataBuffers.has(id)) {
							this._dataBuffers.set(id, new Array());
						}
						this._dataBuffers.get(id).push({
							dataMap: data,
							seqNum: seqNum,
						});
					}
				}

				if (this._childObjects.has(id)) {
					this._childObjects.get(id).importData(<DataMap>this._data.get(prop).data, seqNum);				
				}
			}
		});
	}

	protected idToProp(id : number) : number { return id + this.numProps(); }
	protected propToId(prop : number) : number { return prop - this.numProps(); }

	protected numProps() : number { return this._propHandlers.size; }
	protected numChildren() : number { return this._childObjects.size; }
	protected setProp(prop : number, data : Object, seqNum : number, cb? : () => boolean) : boolean {
		if (this.isSource()) {
			return this._data.set(prop, data, seqNum, () => {
				return defined(cb) ? cb() : true;
			});
		}
		return false;
	}
}