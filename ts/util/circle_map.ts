
import { defined } from 'util/common'

type Node<K, V> = {
	value : V;
	prev : K;
	next : K;
};
type MatchFn<V> = (value : V) => boolean;

export class CircleMap<K, V> {

	private _map : Map<K, Node<K, V>>;
	private _head : K;
	private _tail : K;

	constructor() {
		this._map = new Map();
		this._head = null;
		this._tail = null;
	}

	size() : number { return this._map.size; }
	empty() : boolean { return this._map.size === 0; }
	head() : K { return this._head; }
	tail() : K { return this._tail; }

	has(key : K) : boolean { return this._map.has(key); }
	get(key : K) : V { return this._map.has(key) ? this._map.get(key).value : null; }
	getHead() : V { return this._map.get(this._head).value; }
	getTail() : V { return this._map.get(this._tail).value; }
	hasNext(key : K) : boolean { return this._map.has(key) && this._map.has(this._map.get(key).next); }
	next(key : K) : K { return this._map.has(key) ? this._map.get(key).next : null; }
	hasPrev(key : K) : boolean { return this._map.has(key) && this._map.has(this._map.get(key).prev); }
	prev(key : K) : K { return this._map.has(key) ? this._map.get(key).prev : null; }
	deleteAndNext(key : K) : K {
		const next = this.next(key);
		this.delete(key);
		return next !== key ? next : null;
	}
	deleteAndPrev(key : K) : K {
		const prev = this.prev(key);
		this.delete(key);
		return prev !== key ? prev : null;
	}
	seekAndDelete(key : K, matchFn : MatchFn<V>) : [K, boolean] {
		if (!this.hasNext(key)) {
			return [null, false];
		}
		let current = matchFn(this.get(key)) ? this.next(key) : this.deleteAndNext(key);
		while (current !== key) {
			if (matchFn(this.get(current))) {
				return [current, true];
			}
			current = this.deleteAndNext(current);
		}
		return [null, false];
	}
	rewindAndDelete(key : K, matchFn : MatchFn<V>) : [K, boolean] {
		if (!this.hasPrev(key)) {
			return [null, false];
		}

		let current = matchFn(this.get(key)) ? this.prev(key) : this.deleteAndPrev(key);
		while (current !== key) {
			if (matchFn(this.get(current))) {
				return [current, true];
			}
			current = this.deleteAndPrev(current);
		}
		return [null, false];
	}

	push(key : K, value : V) : void {
		if (this._map.has(key)) {
			this.delete(key);
		}

		if (!defined(this._head)) {
			this._head = key;
		}
		if (!defined(this._tail)) {
			this._tail = key;
		}

		if (this._map.has(this._tail)) {
			let tail = this._map.get(this._tail);
			if (tail.prev === this._tail) {
				tail.prev = key;
			}
			tail.next = key;
		}

		this._map.set(key, {
			value: value,
			prev: this._tail,
			next: this._head,
		});
		this._tail = key;
	}

	delete(key : K) : void {
		if (!this._map.has(key)) {
			return;
		}

		const entry = this._map.get(key);
		if (this._tail === key) {
			this._tail = entry.prev;
		}
		if (this._head === key) {
			this._head = entry.next;
		}
		if (this._map.has(entry.prev)) {
			this._map.get(entry.prev).next = entry.next;
		}
		if (this._map.has(entry.next)) {
			this._map.get(entry.next).prev = entry.prev;
		}
		this._map.delete(key);

		if (this.empty()) {
			this._tail = null;
			this._head = null;
		}
	}
}