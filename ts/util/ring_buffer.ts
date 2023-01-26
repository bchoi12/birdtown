export class RingBuffer<T> {

	private _buffer : Array<T>;

	private _size : number;
	private _index : number;

	constructor(size : number) {
		this._buffer = new Array(size);

		this._size = 0;
		this._index = 0;
	}

	size() : number { return this._size; }
	empty() : boolean { return this._size === 0; }
	full() : boolean { return this._size === this._buffer.length; }

	peek() : T { return this._buffer[this._index]; }

	pop() : T {
		this._index = this.wrapIndex(this._index - 1);

		const obj = this._buffer[this._index];
		this._size = Math.max(this._size - 1, 0);

		return obj;
	}

	push(t : T) : void {
		this._buffer[this._index] = t;
		this._index = this.wrapIndex(this._index + 1);
		this._size = Math.min(this._size + 1, this._buffer.length);
	}

	protected wrapIndex(index : number) {
		return ((index % this._size) + this._size) % this._size;
	}
}