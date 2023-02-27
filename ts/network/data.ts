
import { DataProp, DataPropOptions } from 'network/data_prop'

import { defined } from 'util/common'
import { BitMarker } from 'util/bit_marker'

export enum DataFilter {
	UNKNOWN,
	INIT,
	TCP,
	UDP,
}

// TODO: deprecate DataMap?
export type DataMap = { [k: number]: Object }

export class Data {
	public static readonly allFilters = new Set<DataFilter>([DataFilter.INIT, DataFilter.TCP, DataFilter.UDP]);
	public static readonly initFilters = new Set<DataFilter>([DataFilter.INIT]);
	public static readonly udpFilters = new Set<DataFilter>([DataFilter.INIT, DataFilter.UDP]);
	public static readonly tcpFilters = new Set<DataFilter>([DataFilter.INIT, DataFilter.TCP]);

	public static readonly udp = DataFilter.UDP;
	public static readonly tcp = DataFilter.TCP;

	private static readonly numberEpsilon = 1e-2;

	private _propData : Map<number, DataProp<Object>>;

	constructor() {
		this._propData = new Map();
	}

	static numberEquals(a : number, b : number) : boolean {
		return Math.abs(a - b) < Data.numberEpsilon;
	}

	static equals(a : Object, b : Object) : boolean {
		if (a === b) return true;
		if (!defined(a) || !defined(b)) return false;
		if (a !== Object(a) && b !== Object(b)) {
			if (!Number.isNaN(a) && !Number.isNaN(b)) {
				return Data.numberEquals(<number>a, <number>b);
			}
			return a === b;
		};
		if (Object.keys(a).length !== Object.keys(b).length) return false;

		for (let key in a) {
			if (!(key in b)) return false;
			if (!Data.equals(a[key], b[key])) return false;
		}
		return true;
	}

	empty() : boolean { return this._propData.size === 0; }
	tree() : Map<number, DataProp<Object>> { return this._propData; }
	has(key : number) : boolean { return this._propData.has(key); }
	getProp<T extends Object>(key : number) : DataProp<T> { return <DataProp<T>>this._propData.get(key); }
	getValue<T extends Object>(key : number) : T { return <T>this._propData.get(key).get(); }

	registerProp<T extends Object>(prop : number, propOptions : DataPropOptions<T>) : void {
		this._propData.set(prop, new DataProp<T>(propOptions));
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

	filtered(filter : DataFilter, seqNum : number) : [DataMap, boolean] {
		if (this.empty()) {
			return [{}, false];
		}

		let filtered : DataMap = {};
		let hasData = false;
		this._propData.forEach((prop : DataProp<Object>, key : number) => {
			const [value, shouldPublish] = prop.publish(filter, seqNum);
			if (shouldPublish) {
				filtered[key] = value;
				hasData = hasData || !prop.optional();
			}
		});
		return [filtered, hasData];
	}
}