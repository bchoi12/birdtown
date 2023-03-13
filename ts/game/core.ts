
import { game } from 'game'

import { Data, DataFilter, DataMap } from 'network/data'
import { DataPropOptions } from 'network/data_prop'

import { defined } from 'util/common'
import { Timer } from 'util/timer'

export namespace GameConstants {
	export const gravity = -0.85;
}

type HasFn = () => boolean;
type ExportFn<T extends Object> = () => T;
type ImportFn<T extends Object> = (object : T) => void;

export type PropHandler<T extends Object> = {
	has? : HasFn;
	export : ExportFn<T>;
	import : ImportFn<T>;

	options? : DataPropOptions<T>;
}

export type NameParams = {
	base : string;
	parent? : GameObject;
	target? : GameObject;
	type? : number;
	id? : number;
}

export enum NetworkBehavior {
	UNKNOWN,
	SOURCE,
	COPY,
	RELAY,
	OFFLINE,
}

export type FactoryFn = (id : number) => void
export type ChildCallback<T extends GameObject> = (child : T) => void;

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

	addProp<T extends Object>(handler : PropHandler<T>);
	registerProp<T extends Object>(prop : number, handler : PropHandler<T>);
	setFactoryFn(factoryFn : FactoryFn) : void;
	getFactoryFn() : FactoryFn;
	addChild<T extends GameObject>(id : number, child : T) : T;
	hasChild(id : number) : boolean;
	getChild<T extends GameObject>(id : number) : T;
	unregisterChild(id : number) : void;
	childOrder() : Array<number>;
	executeCallback<T extends GameObject>(cb : ChildCallback<T>) : void;
	getChildren() : Map<number, GameObject>;

	newTimer() : Timer;

	shouldBroadcast() : boolean;
	isHost() : boolean;
	isSource() : boolean;
	setOffline(offline : boolean) : void;
	isOffline() : boolean;
	data() : Data;
	dataMap(filter : DataFilter, seqNum : number) : [DataMap, boolean];
	updateData(seqNum : number) : void;
	importData(data : DataMap, seqNum : number) : void;
}

export abstract class GameObjectBase {
	protected _name : string;
	protected _initialized : boolean;
	protected _offline : boolean;
	protected _deleted : boolean;
	protected _notReadyCounter : number;
	protected _lastUpdateTime : number;
	protected _lastImportTime : number;

	protected _data : Data;
	protected _propHandlers : Map<number, PropHandler<Object>>;
	protected _childOrder : Array<number>;
	protected _childObjects : Map<number, GameObject>;
	protected _dataBuffers : Map<number, Array<DataBuffer>>;

	protected _timers : Array<Timer>;

	protected _factoryFn : FactoryFn;

	constructor(name : string) {
		this._name = name;
		this._initialized = false;
		this._offline = false;
		this._deleted = false;
		this._notReadyCounter = 0;
		this._lastUpdateTime = Date.now();
		this._lastImportTime = Date.now();

		this._data = new Data();
		this._propHandlers = new Map();
		this._childOrder = new Array();
		this._childObjects = new Map();
		this._dataBuffers = new Map();

		this._timers = new Array();
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

	ready() : boolean {
		this._notReadyCounter++;
		if (this._notReadyCounter % 60 === 0) {
			console.error("Warning: %s still not ready", this.name());
		}
		return true;
	}
	initialize() : void {
		if (this._initialized) {
			return;
		}
		this._initialized = true;
	}
	initialized() : boolean {return this._initialized; }
	reset() : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			this.getChild(this._childOrder[i]).reset();
		}
	}
	delete() : void {
		if (this._deleted) {
			return;
		}

		for (let i = 0; i < this._childOrder.length; ++i) {
			this.getChild(this._childOrder[i]).delete();
		};
		this._deleted = true;
	}
	deleted() : boolean { return this._deleted; }
	dispose() : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			this.getChild(this._childOrder[i]).dispose();
		};
	}

	preUpdate(millis : number) : void {
		this._lastUpdateTime = Date.now();

		this._timers.forEach((timer) => {
			timer.elapse(millis);
		});

		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (!child.initialized() && child.ready()) {
				child.initialize();
			}

			if (child.deleted()) {
				child.dispose();
			}

			if (child.initialized()) {
				child.preUpdate(millis);
			}
		};
	}
	update(millis : number) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (child.initialized()) {
				child.update(millis);
			}
		};
	}
	postUpdate(millis : number) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (child.initialized()) {
				child.postUpdate(millis);
			}
		};
	}
	prePhysics(millis : number) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (child.initialized()) {
				child.prePhysics(millis);
			}
		};
	}
	physics(millis : number) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (child.initialized()) {
				child.physics(millis);
			}
		};
	}
	postPhysics(millis : number) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (child.initialized()) {
				child.postPhysics(millis);
			}
		};
	}
	preRender(millis : number) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (child.initialized()) {
				child.preRender(millis);
			}
		};
	}
	render(millis : number) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (child.initialized()) {
				child.render(millis);
			}
		};
	}
	postRender(millis : number) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			let child = this.getChild(this._childOrder[i]);
			if (child.initialized()) {
				child.postRender(millis);
			}
		};
	}

	millisSinceUpdate() : number { return Date.now() - this._lastUpdateTime; }
	millisSinceImport() : number { return Date.now() - this._lastImportTime; }

	addProp<T extends Object>(handler : PropHandler<T>) : void {
		this.registerProp(this.numProps() + 1, handler);
	}
	registerProp<T extends Object>(prop : number, handler : PropHandler<T>) : void {
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

		this._data.registerProp<T>(prop, handler.options ? handler.options : {});
		this._propHandlers.set(prop, handler);
	}

	setFactoryFn(factoryFn : FactoryFn) : void { this._factoryFn = factoryFn; }
	getFactoryFn() : FactoryFn { return this._factoryFn; }
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
		this._childOrder.push(id);
		return child;
	}
	hasChild(id : number) : boolean { return this._childObjects.has(id); }
	getChild<T extends GameObject>(id : number) : T { return <T>this._childObjects.get(id); }
	unregisterChild(id : number) : void {
		if (!this.hasChild(id)) {
			return;
		}

		const index = this._childOrder.indexOf(id);
		if (index !== -1) {
			this._childOrder.splice(index, 1);
		}
		this._childObjects.delete(id);
	}

	childOrder() : Array<number> { return this._childOrder; }
	executeCallback<T extends GameObject>(cb : ChildCallback<T>) : void {
		for (let i = 0; i < this._childOrder.length; ++i) {
			cb(this.getChild<T>(this._childOrder[i]));
		}
	}
	getChildren() : Map<number, GameObject> { return this._childObjects; }

	newTimer() : Timer {
		let timer = new Timer();
		this._timers.push(timer);
		return timer;
	}

	networkBehavior() : NetworkBehavior {
		if (this._offline) {
			return NetworkBehavior.OFFLINE;
		}
		return this.isHost() ? NetworkBehavior.SOURCE : NetworkBehavior.COPY
	}
	shouldBroadcast() : boolean {
		return this.networkBehavior() === NetworkBehavior.SOURCE || this.networkBehavior() === NetworkBehavior.RELAY;
	}
	isHost() : boolean { return game.options().host; }
	isSource() : boolean { return this.networkBehavior() === NetworkBehavior.SOURCE; }
	setOffline(offline : boolean) : void { this._offline = offline; }
	isOffline() : boolean { return this._offline; }
	data() : Data { return this._data; }

	dataMap(filter : DataFilter, seqNum : number) : [DataMap, boolean] {
		if (!this.initialized() || this.isOffline()) {
			return [{}, false];
		}

		let [data, hasData] = this.shouldBroadcast() ? this._data.filtered(filter, seqNum) : [{}, false];
		for (let i = 0; i < this._childOrder.length; ++i) {
			let id = this._childOrder[i];
			let child = this.getChild(this._childOrder[i]);

			const prop = this.idToProp(id);
			const [childData, childHasData] = child.dataMap(filter, seqNum);
			if (childHasData) {
				data[prop] = childData;
				hasData = true;
			}
		};

		return [data, hasData];
	}

	updateData(seqNum : number) : void {
		if (!this.initialized() || this.isOffline()) {
			return;
		}

		if (this.isSource()) {
			this._propHandlers.forEach((fns : PropHandler<Object>, prop : number) => {
				if (!defined(fns.has) || fns.has()) {
					this._data.set(prop, fns.export(), seqNum)
				}
			});
		}

		for (let i = 0; i < this._childOrder.length; ++i) {
			this.getChild(this._childOrder[i]).updateData(seqNum);
		};
	}

	importData(data : DataMap, seqNum : number) : void {
		this._lastImportTime = Date.now();

		if (this.isOffline()) {
			return;
		}

		for (const [stringProp, value] of Object.entries(data)) {
			const prop = Number(stringProp);

			if (this.isProp(prop)) {
				if (!this.isSource() && this._data.set(prop, value, seqNum)) {
					if (this._propHandlers.has(prop)) {
						this._propHandlers.get(prop).import(this._data.getValue(prop));
					}
				}
			} else {
				const id = this.propToId(prop);
				if (!this._childObjects.has(id)) {
					if (defined(this._factoryFn)) {
						// Create child if we can
						this._factoryFn(id);
					} else {
						// Store data in a buffer for later
						if (!this._dataBuffers.has(id)) {
							this._dataBuffers.set(id, new Array());
						}
						this._dataBuffers.get(id).push({
							dataMap: <DataMap>value,
							seqNum: seqNum,
						});
					}
				}

				// Check again if we were able to create the child
				if (this._childObjects.has(id)) {
					this._childObjects.get(id).importData(<DataMap>value, seqNum);
				}
			}
		}
	}

	protected idToProp(id : number) : number { return id + this.numProps(); }
	protected propToId(prop : number) : number { return prop - this.numProps(); }
	protected isProp(key : number) : boolean { return key <= this.numProps(); }
	protected numProps() : number { return this._propHandlers.size; }
	protected numChildren() : number { return this._childObjects.size; }
}