
import { defined } from 'util/common'
import { Optional } from 'util/optional'

type Entry<K, V> = {
	prev : Optional<K>;
	next : Optional<K>;

	key : K;
	value : V;
}

export class SeqMap<K extends number, V> {
	
	private _max : Optional<K>;
	private _entries : Array<Entry<K, V>>;

	constructor(size : number) {
		this._max = new Optional();
		this._entries = new Array(size).fill(null);
	}

	insert(key : K, value : V) : void {
		if (!defined(this._entries[key])) {
			this._entries[key] = {
				prev: new Optional(),
				next: new Optional(),
				key: key,
				value: value,
			};
		}

		if (key >= this._max.get()) {
			this._entries[key].value = value;
			this._max.set(key);
		}
	}

	iterator(key : K) : SeqMapIterator<K, V> {
		return new SeqMapIterator();
	}
}

export class SeqMapIterator<K extends number, V> {

	constructor() {}

	prev() : Entry<K, V> {
		return null;
	}

	next() : Entry<K, V> {
		return null;
	}
}