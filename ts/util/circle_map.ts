
import { defined } from 'util/common'

type Node<K, V> = {
	value : V;
	prev : K;
	next : K;
};
type MatchFn<V> = (value : V) => boolean;

enum StopType {
	UNKNOWN,

	// Don't stop
	NONE,

	// Stop after one successful match
	FIRST,

	// Stop after first N successful matches
	FIRST_N,

	// Stop after first unsuccessful match
	UNTIL,
}
enum RecordType {
	UNKNOWN,

	// Don't record
	NONE,

	// Record number of matches
	MATCH,

	// Record all executed objects
	OBJECT,
}
type ExecuteParams<K, V> = {
	execute : (v : V, k : K) => void;
	predicate : (v : V, k : K) => boolean;
	stopType : StopType;
	recordType : RecordType;

	limit? : number;
}
type ExecuteResult<K, V> = {
	matches? : number;
	objects? : V[];
}

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
	clear() : void {
		this._map.clear();
		this._head = null;
		this._tail = null;
	}
	head() : K { return this._head; }
	tail() : K { return this._tail; }

	has(key : K) : boolean { return this._map.has(key); }
	get(key : K) : V { return this._map.has(key) ? this._map.get(key).value : null; }
	keys() : Array<K> { return Array.from(this._map.keys()); }
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

		if (this._map.has(this._head)) {
			let head = this._map.get(this._head);
			head.prev = key;

			// Break self loop
			if (head.next === this._head) {
				head.next = key;
			}
		}
		if (this._map.has(this._tail)) {
			let tail = this._map.get(this._tail);
			tail.next = key;

			// Break self loop
			if (tail.prev === this._tail) {
				tail.prev = key;
			}
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

	matchCount(predicate : (v : V, k : K) => boolean) : number {
		return this.executeHelper({
			execute: () => {},
			predicate: predicate,
			stopType: StopType.NONE,
			recordType: RecordType.MATCH,
		}).matches;
	}
	matchAll(predicate : (v : V, k : K) => boolean) : boolean {
		if (this.empty()) { return true; }

		return this.executeHelper({
			execute: () => {},
			predicate: predicate,
			stopType: StopType.UNTIL,
			recordType: RecordType.MATCH,
		}).matches === this.size();
	}
	matchAny(predicate : (v : V, k : K) => boolean) : boolean {
		return this.executeHelper({
			execute: () => {},
			predicate: predicate,
			stopType: StopType.FIRST,
			recordType: RecordType.MATCH,
		}).matches > 0;
	}

	mapAll<O>(map : (v : V) => O) : O[] {
		return this.executeHelper({
			execute: () => {},
			predicate: () => { return true; },
			stopType: StopType.NONE,
			recordType: RecordType.OBJECT,
		}).objects.map(map);
	}

	findAll(predicate : (v : V, k : K) => boolean) : V[] {
		return this.executeHelper({
			execute: () => {},
			predicate: predicate,
			stopType: StopType.NONE,
			recordType: RecordType.OBJECT,
		}).objects;
	}
	findN(predicate : (v : V, k : K) => boolean, limit : number) : V[] {
		return this.executeHelper({
			execute: () => {},
			predicate: predicate,
			stopType: StopType.FIRST_N,
			limit: limit,
			recordType: RecordType.OBJECT,
		}).objects;
	}

	execute(fn : (v : V, k : K) => void) : void {
		this.executeHelper({
			execute: fn,
			predicate: () => { return true; },
			stopType: StopType.NONE,
			recordType: RecordType.NONE,
		})
	}
	executeIf(fn: (v : V, k : K) => void, predicate : (v : V, k : K) => boolean) : void {
		this.executeHelper({
			execute: fn,
			predicate: predicate,
			stopType: StopType.NONE,
			recordType: RecordType.NONE,
		});
	}
	executeFirst(fn: (v : V, k : K) => void, predicate : (v : V, k : K) => boolean) : void {
		this.executeHelper({
			execute: fn,
			predicate: predicate,
			stopType: StopType.FIRST,
			recordType: RecordType.NONE,
		});
	}

	private executeHelper(executeParams : ExecuteParams<K, V>) : ExecuteResult<K, V> {
		let current = this.head();
		let matches = 0;
		let iter = 0;

		const stopType = executeParams.stopType;
		const recordType = executeParams.recordType;

		let result : ExecuteResult<K, V> = {};
		if (recordType === RecordType.MATCH) {
			result.matches = 0;
		} else if (recordType === RecordType.OBJECT) {
			result.objects = [];
		}

		while (this.has(current)) {
			if (executeParams.predicate(this.get(current), current)) {
				executeParams.execute(this.get(current), current);
				matches++;

				if (recordType === RecordType.OBJECT) {
					result.objects.push(this.get(current));
				}

				if (stopType === StopType.FIRST) {
					break;
				} else if (stopType === StopType.FIRST_N && matches >= executeParams.limit) {
					break;
				}
			} else {
				if (stopType === StopType.UNTIL) {
					break;
				}
			}

			iter++;
			if (iter === this.size()) {
				break;
			}

			current = this.next(current);
			if (current === this.head()) {
				break;
			}
		}

		if (recordType === RecordType.MATCH) {
			result.matches = matches;
		}

		return result;
	}
}