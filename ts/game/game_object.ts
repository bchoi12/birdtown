
import { game } from 'game'

import { GameObjectState } from 'game/api'
import { GameData, DataFilter } from 'game/game_data'
import { GamePropOptions } from 'game/game_prop'

import { DataMap } from 'message'

import { NetworkBehavior } from 'network/api'

import { CircleMap } from 'util/circle_map'
import { defined } from 'util/common'
import { Timer, TimerOptions } from 'util/timer'

type HasFn = () => boolean;
type ExportFn<T extends Object> = () => T;
type ImportFn<T extends Object> = (object : T) => void;
type RollbackFn<T extends Object> = (object : T, seqNum : number) => void;

export type PropHandler<T extends Object> = {
	has? : HasFn;
	export : ExportFn<T>;
	import : ImportFn<T>;
	rollback? : RollbackFn<T>;
	validate? : ImportFn<T>;

	options? : GamePropOptions<T>;
}

export type NameParams = {
	base? : string;
	parent? : GameObject;
	target? : GameObject;
	type? : number|string;
	id? : number;
}

export type StepData = {
	millis : number;
	realMillis : number;
	seqNum : number;
}

export type FactoryFn = (id : number) => GameObject
export type ChildPredicate<T extends GameObject> = (child : T, id : number) => boolean;
export type ChildExecute<T extends GameObject> = (child : T, id : number) => void;

type DataBuffer = {
	seqNum : number;
	dataMap : DataMap;
}

export interface GameObject {
	name() : string;
	addNameParams(params : NameParams) : void;

	ready() : boolean;
	initialized() : boolean;
	initialize() : void;
	state() : GameObjectState;
	setState(state : GameObjectState) : void;
	reset() : void;
	delete() : void;
	deleted() : boolean;
	dispose() : void;
	disposed() : boolean;

	canStep() : boolean;
	preUpdate(stepData : StepData) : void
	update(stepData : StepData) : void
	postUpdate(stepData : StepData) : void
	prePhysics(stepData : StepData) : void
	physics(stepData : StepData) : void
	postPhysics(stepData : StepData) : void
	preRender() : void
	render() : void
	postRender() : void
	cleanup() : void;

	addProp<T extends Object>(handler : PropHandler<T>);
	registerProp<T extends Object>(prop : number, handler : PropHandler<T>);
	hasFactoryFn() : boolean;
	getFactoryFn() : FactoryFn;
	setFactoryFn(factoryFn : FactoryFn) : void;
	getParent<T extends GameObject>() : T;
	setParent<T extends GameObject>(parent : T) : void;
	addChild<T extends GameObject>(child : T) : T;
	registerChild<T extends GameObject>(id : number, child : T) : T;
	hasChild(id : number) : boolean;
	getChild<T extends GameObject>(id : number) : T;
	unregisterChild(id : number) : void;

	findAll<T extends GameObject>(predicate : (t : T) => boolean) : T[];
	findN<T extends GameObject>(predicate : (t : T) => boolean, limit : number) : T[];
	mapAll<T extends GameObject, O>(map : (t : T) => O) : O[];
	mapIf<T extends GameObject, O>(map : (t : T) => O, predicate : (t :T) => boolean) : O[];
	matchAll<T extends GameObject>(predicate : (t : T) => boolean) : boolean;
	execute<T extends GameObject>(execute : ChildExecute<T>) : void;
	executeIf<T extends GameObject>(execute : ChildExecute<T>, predicate : (t : T) => boolean) : void;

	newTimer(options : TimerOptions) : Timer;

	networkBehavior() : NetworkBehavior;
	shouldBroadcast() : boolean;
	isHost() : boolean;
	isSource() : boolean;
	isOffline() : boolean;
	setOffline(offline : boolean) : void;
	data() : GameData;
	debugDataMap() : DataMap;
	dataMap(filter : DataFilter, seqNum : number) : [DataMap, boolean];
	rollback(data : DataMap, seqNum : number) : void;
	updateData(seqNum : number) : void;
	importData(data : DataMap, seqNum : number) : void;
}

export abstract class GameObjectBase {

	private static readonly _readyPrintInterval = 120;
	private static readonly _numObjectsToPrint = 6;

	protected _name : string;
	protected _nameParams : NameParams;
	protected _initialized : boolean;
	protected _offline : boolean;
	protected _deleted : boolean;
	protected _disposed : boolean;
	protected _state : GameObjectState;
	protected _updateCalls : number;
	protected _readyCalls : number;

	protected _data : GameData;
	protected _propHandlers : Map<number, PropHandler<Object>>;
	protected _parent : GameObject;
	protected _childObjects : CircleMap<number, GameObject>;
	protected _dataBuffers : Map<number, Array<DataBuffer>>;

	protected _timers : Array<Timer>;

	protected _factoryFn : FactoryFn;

	constructor(name : string) {
		this._name = name;
		this._nameParams = {
			base: name,
		};
		this._initialized = false;
		this._offline = false;
		this._deleted = false;
		this._disposed = false;
		this._readyCalls = 0;
		this._state = GameObjectState.NORMAL;
		this._updateCalls = 0;
		this._readyCalls = 0;

		this._data = new GameData();
		this._propHandlers = new Map();
		this._parent = null;
		this._childObjects = new CircleMap();
		this._dataBuffers = new Map();

		this._timers = new Array();
	}

	name() : string { return this._name; }
	addNameParams(params : NameParams) : void {
		this._nameParams = {...this._nameParams, ...params};

		this._name = this._nameParams.base;
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

	private maybePrintUnready() : void {
		if (this._readyCalls <= 0 || this._readyCalls % GameObjectBase._readyPrintInterval !== 0) {
			return;
		}

		const unready : Array<string> = this.findAll((child : GameObject) => {
			return !child.ready();
		}).map((child : GameObject) => {
			return child.name();
		});

		if (unready.length > 0) {
			const extra = Math.max(0, unready.length - GameObjectBase._numObjectsToPrint)
			const objectNames = unready.length > GameObjectBase._numObjectsToPrint
				? unready.slice(0, GameObjectBase._numObjectsToPrint - 1).join(",")
				: unready.join(",");
			console.error("Warning: %s not ready, bad objects: %s, and %d more", this.name(), objectNames, extra);
		} else {
			console.error("Warning: %s not ready", this.name());
		}
	}

	ready() : boolean {
		this._readyCalls++;

		const ready = this.matchAll((obj : GameObject) => {
			return obj.ready();
		});

		if (!ready) {
			this.maybePrintUnready();
		}
		return ready;
	}
	initialize() : void {
		if (this._initialized) {
			return;
		}
		this.updateObjects((obj : GameObject) => {
			if (!obj.initialized() && obj.ready()) {
				obj.initialize();
			}
		});
		this._initialized = true;
	}
	initialized() : boolean {return this._initialized; }
	state() : GameObjectState { return this._state; }
	setState(state : GameObjectState) : void {
		if (this._state === state) {
			return;
		}
		this.updateObjects((obj : GameObject) => {
			obj.setState(state);
		});
		this._state = state;
	}
	reset() : void {
		this.updateObjects((obj : GameObject) => {
			obj.reset();
		});
	}
	delete() : void {
		if (this._deleted) {
			return;
		}
		this.updateObjects((obj : GameObject) => {
			obj.delete();
		});
		this._deleted = true;
	}
	deleted() : boolean { return this._deleted; }
	dispose() : void {
		if (this._disposed) {
			return;
		}
		this.updateObjects((obj : GameObject) => {
			obj.dispose();
		});
		this._disposed = true;
	}
	disposed() : boolean { return this._disposed; }

	protected updateCalls() : number { return this._updateCalls; }
	canStep() : boolean { return this.initialized() && this.state() !== GameObjectState.DEACTIVATED && !this.deleted(); }
	preUpdate(stepData : StepData) : void {
		const millis = stepData.millis;
		this._timers.forEach((timer) => {
			timer.elapse(millis);
		});

		if (this.initialized()) {
			this._updateCalls++;
		}
		this.updateObjects((obj : GameObject) => {
			if (!obj.initialized() && obj.ready()) {
				obj.initialize();
			}
			if (obj.canStep()) {
				obj.preUpdate(stepData);
			}
		});
	}
	update(stepData : StepData) : void {
		this.updateObjects((obj : GameObject) => {
			if (obj.canStep()) {
				obj.update(stepData);
			}
		});
	}
	postUpdate(stepData : StepData) : void {
		this.updateObjects((obj : GameObject) => {
			if (obj.canStep()) {
				obj.postUpdate(stepData);
			}
		});
	}
	prePhysics(stepData : StepData) : void {
		this.updateObjects((obj : GameObject) => {
			if (obj.canStep()) {
				obj.prePhysics(stepData);
			}
		});
	}
	physics(stepData : StepData) : void {
		this.updateObjects((obj : GameObject) => {
			if (obj.canStep()) {
				obj.physics(stepData);
			}
		});
	}
	postPhysics(stepData : StepData) : void {
		this.updateObjects((obj : GameObject) => {
			if (obj.canStep()) {
				obj.postPhysics(stepData);
			}
		});
	}
	preRender() : void {
		this.updateObjects((obj : GameObject) => {
			if (obj.canStep()) {
				obj.preRender();
			}
		});
	}
	render() : void {
		this.updateObjects((obj : GameObject) => {
			if (obj.canStep()) {
				obj.render();
			}
		});
	}
	postRender() : void {
		this.updateObjects((obj : GameObject) => {
			if (obj.canStep()) {
				obj.postRender();
			}
		});
	}
	cleanup() : void {
		this.updateObjects((obj : GameObject, id : number) => {
			obj.cleanup();

			if (obj.disposed()) {
				this.unregisterChild(id);
			}
		});

		if (this.deleted()) {
			this.dispose();
		}
	}

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

	hasFactoryFn() : boolean { return defined(this._factoryFn); }
	getFactoryFn() : FactoryFn { return this._factoryFn; }
	setFactoryFn(factoryFn : FactoryFn) : void { this._factoryFn = factoryFn; }

	getParent<T extends GameObject>() : T { return <T>this._parent; }
	setParent<T extends GameObject>(parent : T) : void { this._parent = parent; }

	addChild<T extends GameObject>(child : T) : T {
		return this.registerChild(this.numChildren() + 1, child);
	}
	registerChild<T extends GameObject>(id : number, child : T) : T {
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
		child.setParent(this);

		this._childObjects.push(id, child);
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

	findAll<T extends GameObject>(predicate : ChildPredicate<T>) : T[] { return <T[]>this._childObjects.findAll(predicate); }
	findN<T extends GameObject>(predicate : ChildPredicate<T>, limit : number) : T[] { return <T[]>this._childObjects.findN(predicate, limit); }
	matchAll<T extends GameObject>(predicate : ChildPredicate<T>) : boolean { return this._childObjects.matchAll(predicate); }
	mapAll<T extends GameObject, O>(map : (t : T) => O) : O[] { return this._childObjects.mapAll(map); }
	mapIf<T extends GameObject, O>(map : (t : T) => O, predicate : (t : T) => boolean) : O[] { return this._childObjects.mapIf(map, predicate); }
	execute<T extends GameObject>(execute : ChildExecute<T>) : void { this._childObjects.execute(execute); }
	executeIf<T extends GameObject>(execute : ChildExecute<T>, predicate : ChildPredicate<T>) : void { this._childObjects.executeIf(execute, predicate); }

	newTimer(options : TimerOptions) : Timer {
		let timer = new Timer(options);
		this._timers.push(timer);
		return timer;
	}

	networkBehavior() : NetworkBehavior {
		if (this.isOffline()) {
			return NetworkBehavior.OFFLINE;
		}
		return this.isHost() ? NetworkBehavior.SOURCE : NetworkBehavior.COPY
	}
	shouldBroadcast() : boolean {
		return this.networkBehavior() === NetworkBehavior.SOURCE || this.networkBehavior() === NetworkBehavior.RELAY;
	}
	isHost() : boolean { return game.isHost(); }
	isSource() : boolean { return this.networkBehavior() === NetworkBehavior.SOURCE || this.networkBehavior() === NetworkBehavior.OFFLINE; }
	isOffline() : boolean { return this._offline; }
	setOffline(offline : boolean) : void { this._offline = offline; }
	data() : GameData { return this._data; }

	debugDataMap() : DataMap {
		if (!this.initialized()) {
			return {};
		}

		let data = this._data.toObject();
		this._childObjects.execute((child : GameObject, id : number) => {
			const prop = this.idToProp(id);
			const childData = child.debugDataMap();
			data[prop] = childData;
		});
		return data;
	}
	dataMap(filter : DataFilter, seqNum : number) : [DataMap, boolean] {
		if (!this.initialized() || this.isOffline()) {
			return [{}, false];
		}

		let [data, hasData] = this.shouldBroadcast() ? this._data.filtered(filter, seqNum) : [{}, false];
		this._childObjects.execute((child : GameObject, id : number) => {
			const prop = this.idToProp(id);
			const [childData, childHasData] = child.dataMap(filter, seqNum);
			if (childHasData) {
				data[prop] = childData;
				hasData = true;
			}
		});
		return [data, hasData];
	}

	rollback(data : DataMap, seqNum : number) : void {
		if (!this.initialized() || this.isOffline()) {
			return;
		}

		for (const [stringProp, value] of Object.entries(data)) {
			const prop = Number(stringProp);
			if (this.isProp(prop)) {
				if (!this._propHandlers.has(prop)) {
					console.error("Error: %s missing prop handler for rollback of %d", this.name(), prop);
					continue;
				}
				const handler = this._propHandlers.get(prop);
				if (handler.rollback) {
					handler.rollback(value, seqNum);
				} else if (!this.isSource()) {
					if (this._data.rollback(prop, value, seqNum)) {
						handler.import(this._data.getValue(prop));
					}
				}
			} else {
				const id = this.propToId(prop);
				if (this._childObjects.has(id)) {
					this._childObjects.get(id).rollback(<DataMap>value, seqNum);
				}
			}
		}
	}

	updateData(seqNum : number) : void {
		if (!this.initialized() || this.isOffline()) {
			return;
		}

		if (this.shouldBroadcast()) {
			this._propHandlers.forEach((handler : PropHandler<Object>, prop : number) => {
				if (!handler.has || handler.has()) {
					this._data.update(prop, handler.export(), seqNum)
				}
			});
		}

		this._childObjects.execute((obj : GameObject) => {
			obj.updateData(seqNum);
		});
	}

	importData(data : DataMap, seqNum : number) : void {
		for (const [stringProp, value] of Object.entries(data)) {
			const prop = Number(stringProp);

			if (this.isProp(prop)) {
				if (!this._propHandlers.has(prop)) {
					console.error("Error: %s missing prop handler for %d", this.name(), prop);
					continue;
				}

				const handler = this._propHandlers.get(prop);
				if (this.isSource()) {
					if (handler.validate) {
						handler.validate(value);
					}
				} else if (this.shouldBroadcast()){
					// If relaying data, check for equality using update()
					if (this._data.update(prop, value, seqNum)) {
						handler.import(this._data.getValue(prop));
					}
				} else {
					// Copying data, just do basic import
					if (this._data.import(prop, value, seqNum)) {
						handler.import(this._data.getValue(prop));
					}
				}
			} else {
				const id = this.propToId(prop);
				if (!this._childObjects.has(id)) {
					if (this.hasFactoryFn()) {
						// Create child if we can
						this.getFactoryFn()(id);
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
	protected numChildren() : number { return this._childObjects.size(); }

	private updateObjects<T extends GameObject>(update : (obj : T, id : number) => void) : void {
		this._childObjects.execute((child : GameObject, id : number) => {
			update(<T>child, id);
		});
	}
}