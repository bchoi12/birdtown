
import { defined } from 'util/common'

export class BitMarker {

	private _bytes : Uint8Array;

	// Number of bits
	private _size : number;

	// Number of times mark() is called
	private _marks : number;

	// Sum of all `1` bits
	private _total : number;

	private _consecutiveTrue : number;
	private _consecutiveFalse : number;

	constructor(bits : number) {
		this._bytes = new Uint8Array(Math.ceil(bits / 8));
		this._size = bits;
		this._marks = 0;
		this._total = 0;

		this._consecutiveTrue = 0;
		this._consecutiveFalse = 0;
	}

	total() : number { return this._total; }
	consecutiveTrue() : number { return this._consecutiveTrue; }
	consecutiveFalse() : number { return this._consecutiveFalse; }

	mark(index : number, mark : boolean) {
		index %= this._size;

		const byteIndex = Math.floor(index / 8);
		let byte = this._bytes[byteIndex]; 

		const bitIndex = index % 8;
		const bit : boolean = ((byte >> bitIndex) & 0b1) === 1;

		if (mark !== bit) {
			byte ^= (0b1 << bitIndex);
			this._bytes[byteIndex] = byte;

			if (mark) {
				this._total++;
			} else {
				this._total--;
			}
		}

		if (mark) {
			this._consecutiveTrue++;
			this._consecutiveFalse = 0;
		} else {
			this._consecutiveTrue = 0;
			this._consecutiveFalse++;
		}

		this._marks++;
	}

	percent() : number {
		if (this._marks <= 0) {
			return 0;
		}
		return this._total / Math.min(this._marks, this._size);
	}
}