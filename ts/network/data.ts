import { defined } from 'util/common'
import { BitMarker } from 'util/bit_marker'

export enum DataFilter {
	UNKNOWN = 0,
	ALL = 1,
	TCP = 2,
	UDP = 3,
}

// TODO: deprecate DataMap?
export type DataMap = { [k: number]: Object }
type DataTree = Map<number, PropData>;

enum NodeType {
	UNKNOWN,
	BRANCH,
	LEAF,
}

type PropData = {
	data : Object;
	change : BitMarker;
	seqNum : number;
	params : PropParams;
}

export type PropParams = {
	leaf: boolean;
	filters: Set<DataFilter>;
}

export class Data {
	public static readonly allFilters = new Set<DataFilter>([DataFilter.ALL, DataFilter.TCP, DataFilter.UDP]);
	public static readonly udp = new Set<DataFilter>([DataFilter.ALL, DataFilter.UDP]);
	public static readonly tcp = new Set<DataFilter>([DataFilter.ALL, DataFilter.TCP]);

	private static readonly numberEpsilon = 1e-3;

	private _propData : DataTree;
	private _propParams : Map<number, PropParams>;

	constructor() {
		this._propData = new Map();
		this._propParams = new Map();
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
	tree() : DataTree { return this._propData; }
	has(key : number) : boolean { return this._propData.has(key); }
	get(key : number) : PropData { return this._propData.get(key); }

	registerProp(prop : number, params : PropParams) : void { this._propParams.set(prop, params); }

	set(key : number, node : Object, seqNum : number, predicate? : () => boolean) : boolean {
		if (!defined(node)) {
			return false;
		}

		if (defined(predicate) && !predicate()) {
			this.recordChange(key, seqNum, false);
			return false;
		}

		let changed = false;
		if (!this.has(key)) {
			this._propData.set(key, {
				data: node,
				change: new BitMarker(32),
				seqNum: seqNum,
				params: this._propParams.has(key) ? this._propParams.get(key) : { leaf: false, filters: Data.allFilters },
			});
			changed = true;
		} else if (seqNum >= this.get(key).seqNum) {
			if (!this.get(key).params.leaf || !Data.equals(node, this.get(key).data)) {
				this.get(key).data = node;
				changed = true;
			}
		}

		this.recordChange(key, seqNum, changed);
		return changed;
	}

	import(data : DataMap, seqNum : number, predicate? : (key : number) => boolean) : Set<number> {
		let changed = new Set<number>();

		for (const [stringKey, value] of Object.entries(data)) {
			const key = Number(stringKey);
			const updatePredicate = () => {
				return defined(predicate) ? predicate(key) : true;
			};
			if (this.set(key, value, seqNum, updatePredicate)) {
				changed.add(key);
			}
		}
		return changed;
	}

	filtered(filter : DataFilter) : [DataMap, boolean] {
		if (this.empty()) {
			return [{}, false];
		}

		let filtered : DataMap = {};
		let hasData = false;
		this._propData.forEach((prop : PropData, key : number) => {
			if (!this.get(key).params.filters.has(filter)) {
				return;
			}

			if (filter === DataFilter.ALL) {
				filtered[key] = prop.data;
				hasData = true;
				return;
			}

			if (filter === DataFilter.TCP) {
				if (prop.change.consecutiveTrue() === 1 || prop.change.consecutiveFalse() === 1) {
					filtered[key] = prop.data;
					hasData = true;
				}
			} else if (filter === DataFilter.UDP) {
				if (prop.change.consecutiveTrue() >= 1 || prop.change.consecutiveFalse() <= 2) {
					filtered[key] = prop.data;
					hasData = true;
				}
			}	
		});
		return [filtered, hasData];
	}

	protected recordChange(key : number, seqNum : number, change : boolean) {
		this.get(key).change.mark(seqNum, change);

		if (change) {
			this.get(key).seqNum = seqNum;
		}
	}
}