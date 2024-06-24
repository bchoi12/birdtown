

export class RingBuffer<T> {

	protected _buffer : Array<T>;
	protected _maxSize : number;
	protected _size : number;
	// Points to next index to insert
	protected _index : number;

	constructor(maxSize : number) {
		this._buffer = new Array(maxSize);
		this._maxSize = maxSize;
		this._size = 0;
		this._index = 0;
	}

	array() : Array<T> { return this._buffer; }
	get(index : number) : T { return this._buffer[index]; }
	set(index : number, value : T) : void { this._buffer[index] = value; }
	size() : number { return this._size; }
	empty() : boolean { return this._size === 0; }
	full() : boolean { return this._size === this._buffer.length; }

	clear() : void {
		this._size = 0;
		this._index = 0;
	}

	peek() : T {
		if (this.empty()) {
			return null;
		}
		return this._buffer[this.wrapIndex(this._index - 1)];
	}

	popFirst() : T {
		if (this.empty()) {
			return null;
		}

		const index = this.wrapIndex(this._index - this._size);
		const obj = this._buffer[index]
		this._size--;
		return obj;
	}

	pop() : T {
		if (this.empty()) {
			return null;
		}

		this._index = this.wrapIndex(this._index - 1);
		const obj = this._buffer[this._index];
		this._size--;

		return obj;
	}

	push(t : T) : T {
		const current = this.full() ? this._buffer[this._index] : null;
		this._buffer[this._index] = t;
		this._index = this.wrapIndex(this._index + 1);
		this._size = Math.min(this._size + 1, this._buffer.length);
		return current;
	}

	protected wrapIndex(index : number) {
		return ((index % this._maxSize) + this._maxSize) % this._maxSize;
	}
}