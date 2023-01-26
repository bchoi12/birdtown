
export class Buffer<T> {
	private _buffer : Array<T>;
	private _size : number;

	constructor() {
		this._buffer = new Array();
		this._size = 0;
	}

	has(i : number) : boolean { return i < this._size; }
	get(i : number) : T { return this._buffer[i]; }
	entries() : Array<T> { return this._buffer; }
	clear() : void { this._size = 0; }
	empty() : boolean { return this._size === 0; }
	size() : number { return this._size; }

	push(t : T) : void {
		if (this._size >= this._buffer.length) {
			this._buffer.push(t);
		} else {
			this._buffer[this._size] = t;
		}
		this._size++;
	}
}