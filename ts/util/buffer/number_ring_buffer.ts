
import { RingBuffer } from 'util/buffer/ring_buffer'
import { Optional } from 'util/optional'

export class NumberRingBuffer extends RingBuffer<number> {

	private _total : number;

	private _min : Optional<number>;
	private _max : Optional<number>;

	constructor(size : number) {
		super(size);

		this._total = 0;

		this._min = Optional.empty(0);
		this._max = Optional.empty(0);
	}

	average() : number {
		if (this.size() === 0) {
			return 0;
		}
		return this._total / this.size();
	}

	min() : number { return this._min.has() ? this._min.get() : 0; }
	max() : number { return this._max.has() ? this._max.get() : 0; }
	flushStats() : void {
		this._min.clear();
		this._max.clear();
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

		if (!this._min.has() || num < this._min.get()) {
			this._min.set(num);
		}
		if (!this._max.has() || num > this._max.get()) {
			this._max.set(num)
		}

		if (current != null) {
			this._total -= current;
		}
		this._total += num;
		return current;
	}
}