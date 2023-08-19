
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

	max() : [K, boolean] { return [this._max.get(), this._max.has()]; }
	hasMax() : boolean { return this._max.has(); }
	getMax() : [V, boolean] {
		let [max, ok] = this.max();
		if (ok) {
			return this.get(max);
		}
		return [null, false];
	}

	peek() : [V, boolean] {
		let [max, hasMax] = this.max();
		if (hasMax) {
			return this.get(max);
		}
		return [null, false];
	}

	insert(key : K, value : V) : boolean {
		let [entry, ok] = this.getEntry(key);

		// Disallow inserting older data
		if (ok && entry.key > key) {
			return false;
		}

		const index = this.index(key);
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

			if (hasPrev) {
				let [prevEntry, hasPrevEntry] = this.getEntry(prev);
				if (hasPrevEntry) {
					prevEntry.next.set(index);
				}
			}
			if (hasNext) {
				let [nextEntry, hasNextEntry] = this.getEntry(next);
				if (hasNextEntry) {
					nextEntry.prev.set(index);
				}
			}
		}

		if (!this._max.has() || key > this._max.get()) {
			this._max.set(key);
		}
		return true;
	}

	has(key : K) : boolean {
		const index = this.index(key);
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
	getNext(key : K) : [V, boolean] {
		let [next, hasNext] = this.next(key);
		if (hasNext) {
			return this.get(next);
		}
		return [null, false];
	}
	getOrNext(key : K) : [V, boolean] {
		let [entry, ok] = this.get(key);
		if (ok) {
			return [entry, true];
		}
		return this.getNext(key);
	}
	getPrev(key : K) : [V, boolean] {
		let [prev, hasPrev] = this.prev(key);
		if (hasPrev) {
			return this.get(prev);
		}
		return [null, false];
	}
	getOrPrev(key : K) : [V, boolean] {
		let [entry, ok] = this.get(key);
		if (ok) {
			return [entry, true];
		}
		return this.getPrev(key);
	}

	prev(key : K) : [K, boolean] {
		let [entry, ok] = this.getEntry(key);
		if (ok) {
			return [entry.prev.get(), entry.prev.has()];
		}

		const [max, hasMax] = this.max();
		if (!hasMax) {
			return [null, false];
		}
		if (key > max) {
			return [max, true];
		}

		let current = max;
		for (let i = 0; i < this._size; ++i) {
			if (current >= key) {
				break;
			}
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

		const [max, hasMax] = this.max();
		if (!hasMax) {
			return [null, false];
		}
		if (key >= max) {
			return [null, false];
		}

		let current = max;
		for (let i = 0; i < this._size; ++i) {
			let [prev, hasPrev] = this.prev(current);
			if (!hasPrev) {
				return [null, false];
			}

			if (prev <= key) {
				return [current, true];
			}
		}
		return [null, false];
	}

	private getEntry(key : K) : [Entry<K, V>, boolean] {
		const index = this.index(key);
		if (this.has(key)) {
			let entry = this._entries[index];
			return [entry, true];
		}
		return [null, false];
	}

	private index(key : K) : K {
		return <K>(((key % this._size) + this._size) % this._size);
	}
}