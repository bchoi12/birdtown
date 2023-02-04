
import { defined } from 'util/common'
import { SeededRandom } from 'util/seeded_random'

export class Buffer<T> {
	private _buffer : Array<T>;
	private _size : number;

	constructor() {
		this._buffer = new Array();
		this._size = 0;
	}

	static from<T>(...values : T[]) : Buffer<T> {
		let buffer = new Buffer<T>();

		for (let i = 0; i < values.length; ++i) {
			buffer.push(values[i]);
		}

		return buffer;
	}

	has(i : number) : boolean { return i < this._size; }
	get(i : number) : T { return this._buffer[i]; }
	getRandom(rng? : SeededRandom) { return this._buffer[Math.floor((defined(rng) ? rng.next() : Math.random()) * this._size)]}
	clear() : void { this._size = 0; }
	empty() : boolean { return this._size === 0; }
	size() : number { return this._size; }

	shuffle(rng? : SeededRandom) : void {
	    for (let i = this._size - 1; i > 0; i--) {
	        let j = Math.floor((defined(rng) ? rng.next() : Math.random()) * (i + 1));
	        let temp = this._buffer[i];
	        this._buffer[i] = this._buffer[j];
	        this._buffer[j] = temp;
	    }
	}

	peek() : T {
		if (this.empty()) {
			return null;
		}
		return this._buffer[this._size - 1];
	}
	pop() : T {
		if (this.empty()) {
			return null;
		}
		this._size--;
		return this._buffer[this._size];
	}
	push(t : T) : void {
		if (this._size >= this._buffer.length) {
			this._buffer.push(t);
		} else {
			this._buffer[this._size] = t;
		}
		this._size++;
	}
}