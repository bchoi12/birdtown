
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
	private _size : number;
	private _entries : Array<Entry<K, V>>;

	constructor(size : number) {
		this._max = new Optional();
		this._size = size;
		this._entries = new Array(size).fill(null);
	}

	insert(key : K, value : V) : boolean {
		let [entry, ok] = this.getEntry(key);

		// Disallow inserting older data
		if (ok && entry.key > key) {
			return false;
		}

		const index = key % this._size;
		if (ok && entry.key === key) {
			this._entries[index].value = value;
		} else {
			const [prev, hasPrev] = this.prev(key);
			const [next, hasNext] = this.next(key);
			this._entries[index] = {
				prev: new Optional(prev),
				next: new Optional(next),
				key: key,
				value : value,
			}
		}

		if (!this._max.has() || key > this._max.get()) {
			this._max.set(key);
		}
		return true;
	}

	has(key : K) : boolean {
		const index = key % this._size;
		if (!defined(this._entries[index])) {
			return false;
		}
		if (this._entries[index].key !== key) {
			return false;
		}
		return true;
	}

	get(key : K) : [V, boolean] {
		let [entry, ok] = this.getEntry(key);
		if (ok) {
			return [entry.value, true];
		}
		return [null, false];
	}

	prev(key : K) : [K, boolean] {
		let [entry, ok] = this.getEntry(key);
		if (ok) {
			return [entry.prev.get(), entry.prev.has()];
		}

		if (!this._max.has()) {
			return [null, false];
		}

		const max = this._max.get();
		if (key > max) {
			return [max, this.has(max)];
		}

		let current = max;
		while (current >= key) {
			let [entry, ok] = this.getEntry(current);

			if (!ok || !entry.prev.has()) {
				return [null, false];
			}
			current = entry.prev.get();
		}

		return [current, this.has(current)];
	}

	next(key : K) : [K, boolean] {
		let [entry, ok] = this.getEntry(key);
		if (ok) {
			return [entry.next.get(), entry.next.has()];
		}

		if (!this._max.has()) {
			return [null, false];
		}

		const max = this._max.get();
		if (key >= max) {
			return [null, false];
		}

		let current = max;
		while (current > key) {
			let [entry, ok] = this.getEntry(current);

			if (!ok || !entry.prev.has()) {
				return [null, false];
			}

			current = entry.prev.get();
			if (current <= key) {
				return [entry.key, this.has(entry.key)];
			}
		}
		return [null, false];
	}

	private getEntry(key : K) : [Entry<K, V>, boolean] {
		const index = key % this._size;
		if (this.has(key)) {
			let entry = this._entries[index];
			return [entry, true];
		}
		return [null, false];
	}
}