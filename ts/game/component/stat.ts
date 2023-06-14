
import { Component, ComponentBase } from 'game/component'
import { ComponentType, StatType } from 'game/component/api'

import { Optional } from 'util/optional'
import { RingBuffer } from 'util/ring_buffer'

export type StatInitOptions = {
	initial : number;
	current : number;
	min? : number;
	max? : number;
}

export interface StatUpdate {
	fromId? : number;
	amount : number;
}

export interface StatLog extends StatUpdate {
	ts : number;
}

export class Stat extends ComponentBase implements Component {

	private static readonly _bufferSize : number = 20;

	private _initial : number;
	private _current : number;
	private _min : Optional<number>;
	private _max : Optional<number>;
	private _logBuffer : RingBuffer<StatLog>;

	constructor(init : StatInitOptions) {
		super(ComponentType.STAT);

		this._initial = init.initial;
		this._current = init.current;
		this._min = new Optional(init.min);
		this._max = new Optional(init.max);
		this._logBuffer = new RingBuffer(Stat._bufferSize);

		this.addProp<number>({
			export: () => { return this._initial; },
			import: (obj : number) => { this._initial = obj; },
		});
		this.addProp<number>({
			export: () => { return this._current; },
			import: (obj : number) => { this._current = obj; },
		});
		this.addProp<number>({
			has: () => { return this._min.has(); },
			export: () => { return this._min.get(); },
			import: (obj : number) => { this._min.set(obj); },
		});
		this.addProp<number>({
			has: () => { return this._max.has(); },
			export: () => { return this._max.get(); },
			import: (obj : number) => { this._max.set(obj); },
		});
	}

	reset() : void {
		this._current = this._initial;
		this._logBuffer.clear();
	}

	atMin() : boolean { return this._min.has() && this._current <= this._min.get(); }
	atMax() : boolean { return this._max.has() && this._current >= this._max.get(); }

	getInitial() : number { return this._initial; }
	setInitial(def : number) : void { this._initial = def; }

	getCurrent() : number { return this._current; }
	setCurrent(current : number) : void { this._current = current; }
	updateCurrent(update : StatUpdate) : void {
		if (!this.isSource()) {
			return;
		}

		if (update.amount < 0) {
			if (this._min.has()) {
				if (this._current <= this._min.get()) {
					update.amount = 0;
				}

				update.amount = Math.max(this._min.get() - this._current, update.amount);
			}
		}

		if (update.amount > 0) {
			if (this._current >= this._max.get()) {
				update.amount = 0;
			}

			update.amount = Math.max(this._max.get() - this._current, update.amount);
		}

		if (update.amount === 0) {
			return;
		}

		this._current += update.amount;
		this._logBuffer.push({
			...update,
			ts: Date.now(),
		});
	}

	flush(skip : (log : StatLog) => boolean, stop : (log : StatLog) => boolean) : [StatLog, boolean] {
		while(!this._logBuffer.empty()) {
			const log = this._logBuffer.pop();
			if (stop(log)) {
				break;
			}

			if (skip(log)) {
				continue;
			}
			return [log, true];
		}

		return [null, false];
	}
}