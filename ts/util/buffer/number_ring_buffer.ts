
import { RingBuffer } from 'util/buffer/ring_buffer'

export class NumberRingBuffer extends RingBuffer<number> {

	private _total : number;

	constructor(size : number) {
		super(size);

		this._total = 0;
	}

	average() : number {
		if (this.size() === 0) {
			return 0;
		}
		return this._total / this.size();
	}

	override set(index : number, value : number) : void {
		this._total -= this.get(index);
		this._total += value;
		super.set(index, value);
	}

	override pop() : number {
		const num = super.pop();
		this._total -= num;
		return num;
	}

	override push(num : number) : number {
		const current = super.push(num);

		if (current != null) {
			this._total -= current;
		}
		this._total += num;
		return current;
	}
}