
import { DataObject, DataObjectBase, DataFilter } from 'network/data'
import { Int } from 'network/object/int'

import { defined } from 'util/common'

export class DataMap<K extends Int, V extends DataObject<any>> extends DataObjectBase<Map<K, V>> implements DataObject<Map<K, V>> {

	constructor() {
		super();

		this.initialize(new Map());
	}

	override get() : Map<K, V> { return new Map(super.get()); }
	override equals(other : Map<K, V>) : boolean {
		if (!this.has()) {
			return false;
		}
		if (this.get().size !== other.size) {
			return false;
		}

		this.get().forEach((value : V, key : K) => {
			if (!other.has(key)) {
				return false;
			}

			if (!other.get(key).equals(value)) {
				return false;
			}
		});
		return true;
	}

	override filtered(filter : DataFilter) : [Object, boolean] {
		let object = {};
		let nonEmpty = false;
		this.get().forEach((value : V, key : K) => {
			let [obj, has] = value.filtered(filter);
			if (has) {
				object[key.get()] = obj;
				nonEmpty = true;
			}

			nonEmpty = true;
		});

		return [object, nonEmpty];
	}
}