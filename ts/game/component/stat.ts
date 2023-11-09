
import { Component, ComponentBase } from 'game/component'
import { ComponentType, AssociationType, StatType } from 'game/component/api'
import { StatLog } from 'game/component/util/stat_log'
import { StatNumber } from 'game/component/util/stat_number'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { RingBuffer } from 'util/buffer/ring_buffer'

export type StatInitOptions = {
	stat? : number;
	min? : number;
	max? : number;
}

export type StatUpdate = {
	delta : number;
	entity? : Entity;
}

export class Stat extends ComponentBase implements Component {

	private static readonly _bufferSize : number = 30;

	private _stat : StatNumber;
	private _min : Optional<StatNumber>;
	private _max : Optional<StatNumber>;
	private _logBuffer : RingBuffer<StatLog>;

	constructor(init : StatInitOptions) {
		super(ComponentType.STAT);

		this._stat = new StatNumber(defined(init.stat) ? init.stat : 0);
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
	getStatNumber() : StatNumber { return this._stat; }
	getCurrent() : number { return this._stat.get(); }

	updateStat(update : StatUpdate) : void {
		if (!this.isSource()) {
			return;
		}

		if (update.delta < 0) {
			if (this._min.has()) {
				const min = this._min.get();
				if (this._stat.get() <= min.get()) {
					update.delta = 0;
				}

				update.delta = Math.max(min.get() - this._stat.get(), update.delta);
			}
		}

		if (update.delta > 0) {
			if (this._max.has()) {
				const max = this._max.get();
				if (this._stat.get() >= max.get()) {
					update.delta = 0;
				}

				update.delta = Math.max(max.get() - this._stat.get(), update.delta);
			}
		}

		if (update.delta === 0) {
			return;
		}

		this._stat.add(update.delta);

		if (update.entity) {
			this._logBuffer.push(new StatLog({
				timestamp: Date.now(),
				delta: update.delta,
				entity: update.entity,	
			}));
		}
	}

	flush(pick : (log : StatLog) => boolean, stop : (log : StatLog) => boolean) : [StatLog, boolean] {
		while(!this._logBuffer.empty()) {
			const log = this._logBuffer.pop();
			if (stop(log)) {
				break;
			}

			if (pick(log)) {
				return [log, true];
			}
		}

		return [null, false];
	}
}