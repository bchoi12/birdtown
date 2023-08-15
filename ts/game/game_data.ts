
import { GameProp, GamePropOptions } from 'game/game_prop'

import { DataMap } from 'message'

import { defined } from 'util/common'
import { BitMarker } from 'util/bit_marker'

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

	private _propData : Map<number, GameProp<Object>>;

	constructor() {
		this._propData = new Map();
	}

	empty() : boolean { return this._propData.size === 0; }
	has(key : number) : boolean { return this._propData.has(key); }
	getValue<T extends Object>(key : number) : T { return <T>this._propData.get(key).get(); }

	registerProp<T extends Object>(prop : number, propOptions : GamePropOptions<T>) : void {
		this._propData.set(prop, new GameProp<T>(propOptions));
	}

	equals(key : number, value : Object) : boolean {
		return this._propData.get(key).equals(value);
	}

	set(key : number, value : Object, seqNum : number) : boolean {
		if (!defined(value)) {
			return false;
		}
		if (!this.has(key)) {
			return false;
		}

		return this._propData.get(key).set(value, seqNum);
	}

	rollback(key : number, value : Object, seqNum : number) : boolean {
		if (!defined(value)) {
			return false;
		}
		if (!this.has(key)) {
			return false;
		}

		return this._propData.get(key).rollback(value, seqNum);
	}

	filtered(filter : DataFilter, seqNum : number) : [DataMap, boolean] {
		if (this.empty()) {
			return [{}, false];
		}

		let filtered : DataMap = {};
		let hasData = false;
		this._propData.forEach((prop : GameProp<Object>, key : number) => {
			const [value, shouldPublish] = prop.publish(filter, seqNum);
			if (shouldPublish) {
				filtered[key] = value;
				hasData = hasData || !prop.optional();
			}
		});
		return [filtered, hasData];
	}
}