
export class Buffer<T> {
	private _buffer : Array<T>;
	private _size : number;

	constructor() {
		this._buffer = new Array();
		this._size = 0;
	}

	has(i : number) : boolean { return i < this._size; }
	get(i : number) : T { return this._buffer[i]; }
	clear() : void { this._size = 0; }
	empty() : boolean { return this._size === 0; }
	size() : number { return this._size; }

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