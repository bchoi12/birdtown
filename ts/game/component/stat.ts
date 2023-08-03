
import { Component, ComponentBase } from 'game/component'
import { ComponentType, StatType } from 'game/component/api'
import { StatNumber } from 'game/component/util/stat_number'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { RingBuffer } from 'util/ring_buffer'

export type StatInitOptions = {
	stat : number;
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

	private _stat : StatNumber;
	private _min : Optional<StatNumber>;
	private _max : Optional<StatNumber>;
	private _logBuffer : RingBuffer<StatLog>;

	constructor(init : StatInitOptions) {
		super(ComponentType.STAT);

		this._stat = new StatNumber(init.stat);
		this._min = new Optional();
		if (defined(init.min)) {
			this._min.set(new StatNumber(init.min));
		}
		this._max = new Optional();
		if (defined(init.max)) {
			this._max.set(new StatNumber(init.max));
		}
		this._logBuffer = new RingBuffer(Stat._bufferSize);

		this.addProp<number>({
			export: () => { return this._stat.get(); },
			import: (obj : number) => { this._stat.set(obj); },
		});
		this.addProp<number>({
			has: () => { return this._min.has(); },
			export: () => { return this._min.get().get(); },
			import: (obj : number) => {
				if (!this._min.has()) {
					this._min.set(new StatNumber(obj));
				} else {
					this._min.get().set(obj);
				}
			},
		});
		this.addProp<number>({
			has: () => { return this._max.has(); },
			export: () => { return this._max.get().get(); },
			import: (obj : number) => {
				if (!this._max.has()) {
					this._max.set(new StatNumber(obj));
				} else {
					this._max.get().set(obj);
				}
			},
		});
	}

	reset() : void {
		this._stat.reset();
		if (this._min.has()) {
			this._min.get().reset();
		}
		if (this._max.has()) {
			this._max.get().reset();
		}
		this._logBuffer.clear();
	}
	clearBoosts() : void {
		this._stat.clearBoosts();
		if (this._min.has()) {
			this._min.get().clearBoosts();
		}
		if (this._max.has()) {
			this._max.get().clearBoosts();
		}
	}
	boost() : void {
		this._stat.boost();
		if (this._min.has()) {
			this._min.get().boost();
		}
		if (this._max.has()) {
			this._max.get().boost();
		}
	}

	atMin() : boolean { return this._min.has() && this._stat.get() <= this._min.get().get(); }
	atMax() : boolean { return this._max.has() && this._stat.get() >= this._max.get().get(); }
	getMin() : Optional<StatNumber> { return this._min; }
	getMax() : Optional<StatNumber> { return this._max; }
	getStat() : StatNumber { return this._stat; }

	updateStat(update : StatUpdate) : void {
		if (!this.isSource()) {
			return;
		}

		if (update.amount < 0) {
			if (this._min.has()) {
				const min = this._min.get();
				if (this._stat.get() <= min.get()) {
					update.amount = 0;
				}

				update.amount = Math.max(min.get() - this._stat.get(), update.amount);
			}
		}

		if (update.amount > 0) {
			if (this._max.has()) {
				const max = this._max.get();
				if (this._stat.get() >= max.get()) {
					update.amount = 0;
				}

				update.amount = Math.max(max.get() - this._stat.get(), update.amount);
			}
		}

		if (update.amount === 0) {
			return;
		}

		this._stat.add(update.amount);
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