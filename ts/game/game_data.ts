
import { GameProp, GamePropOptions } from 'game/game_prop'

import { DataMap } from 'message'

import { defined } from 'util/common'

export enum DataFilter {
	UNKNOWN,
	INIT,
	TCP,
	UDP,
}

export class GameData {
	public static readonly allFilters = new Set<DataFilter>([DataFilter.INIT, DataFilter.TCP, DataFilter.UDP]);
	public static readonly initFilters = new Set<DataFilter>([DataFilter.INIT]);
	public static readonly udpFilters = new Set<DataFilter>([DataFilter.INIT, DataFilter.UDP]);
	public static readonly tcpFilters = new Set<DataFilter>([DataFilter.INIT, DataFilter.TCP]);

	public static readonly udp = DataFilter.UDP;
	public static readonly tcp = DataFilter.TCP;

	private _gameProps : Map<number, GameProp<Object>>;

	constructor() {
		this._gameProps = new Map();
	}

	empty() : boolean { return this._gameProps.size === 0; }
	has(key : number) : boolean { return this._gameProps.has(key); }
	get(key : number) : GameProp<Object> { return this._gameProps.get(key); }
	getValue<T extends Object>(key : number) : T { return <T>this._gameProps.get(key).get(); }

	import(key : number, value : Object, seqNum : number) : boolean {
		if (!this.has(key)) {
			return false;
		}

		return this._gameProps.get(key).import(value, seqNum);
	}
	relay(key : number, value : Object, seqNum : number) : boolean {
		if (!this.has(key)) {
			return false;
		}

		return this._gameProps.get(key).relay(value, seqNum);
	}
	update(key : number, value : Object, seqNum : number) : boolean {
		if (!this.has(key)) {
			return false;
		}

		return this._gameProps.get(key).update(value, seqNum);
	}

	registerProp<T extends Object>(prop : number, propOptions : GamePropOptions<T>) : void {
		this._gameProps.set(prop, new GameProp<T>(propOptions));
	}

	equals(key : number, value : Object) : boolean {
		return this._gameProps.get(key).equals(value);
	}

	rollback(key : number, value : Object, seqNum : number) : boolean {
		if (!defined(value)) {
			return false;
		}
		if (!this.has(key)) {
			return false;
		}

		return this._gameProps.get(key).rollback(value, seqNum);
	}

	filtered(filter : DataFilter, seqNum : number) : [DataMap, boolean] {
		if (this.empty()) {
			return [{}, false];
		}

		let filtered : DataMap = {};
		let hasData = false;
		this._gameProps.forEach((prop : GameProp<Object>, key : number) => {
			const [value, shouldPublish] = prop.publish(filter, seqNum);
			if (shouldPublish) {
				filtered[key] = value;
				hasData = hasData || !prop.isOptional();
			}
		});
		return [filtered, hasData];
	}

	toObject() : DataMap {
		let obj = {};
		this._gameProps.forEach((prop : GameProp<Object>, key : number) => {
			obj[key] = prop.get();
		});
		return obj;
	}
}