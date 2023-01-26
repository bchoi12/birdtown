
import { RingBuffer } from 'util/ring_buffer'

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

	override pop() : number {
		const num = super.pop();
		this._total -= num;
		return num;
	}

	override push(num : number) : void {
		if (this.full()) {
			this._total -= this.peek();
		}

		super.push(num);
		this._total += num;
	}
}