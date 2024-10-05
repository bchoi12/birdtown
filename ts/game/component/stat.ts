
import { Component, ComponentBase } from 'game/component'
import { ComponentType, AssociationType, StatType } from 'game/component/api'
import { StatLog } from 'game/component/util/stat_log'
import { StatNumber } from 'game/component/util/stat_number'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { RingBuffer } from 'util/buffer/ring_buffer'

export type StatInitOptions = {
	base : number;
	min : number;
	max : number;
}

export type StatUpdate = {
	delta : number;
	entity? : Entity;
}

export class Stat extends ComponentBase implements Component {

	private static readonly _bufferSize : number = 10;

	private _stat : StatNumber;
	private _min : number;
	private _max : StatNumber;
	private _logBuffer : RingBuffer<StatLog>;

	constructor(init : StatInitOptions) {
		super(ComponentType.STAT);

		this._stat = new StatNumber(init.base);
		this._min = init.min;
		this._max = new StatNumber(init.max);
		this._logBuffer = new RingBuffer(Stat._bufferSize);

		this.addProp<number>({
			export: () => { return this._stat.get(); },
			import: (obj : number) => { this._stat.set(obj); },
		});
		this.addProp<number>({
			export: () => { return this._stat.base(); },
			import: (obj : number) => { this._stat.setBase(obj); },
		});
		this.addProp<number>({
			has: () => { return this._min !== 0; },
			export: () => { return this._min; },
			import: (obj : number) => { this._min = obj; },
		});
		this.addProp<number>({
			export: () => { return this._max.get(); },
			import: (obj : number) => { this._max.set(obj); },
		});
		this.addProp<number>({
			export: () => { return this._max.base(); },
			import: (obj : number) => { this._max.setBase(obj); },
		});
	}

	reset() : void {
		this._stat.reset();
		this._max.reset();
		this._logBuffer.clear();
	}

	current() : number { return this._stat.get(); }
	percent() : number { return this.current() / this.max(); }
	atMin() : boolean { return this.current() <= this.min(); }
	atMax() : boolean { return this.current() >= this.max(); }
	min() : number { return this._min; }
	max() : number { return this._max.get(); }

	updateStat(update : StatUpdate) : void {
		if (!this.isSource() || !this.initialized()) {
			return;
		}

		if (this.current() + update.delta < this.min()) {
			update.delta = Fns.clamp(this.min() - this.current(), update.delta, 0);
			this._stat.set(this.min());
		} else if (this.current() + update.delta > this.max()) {
			update.delta = Fns.clamp(0, update.delta, this.max() - this.current());
			this._stat.set(this.max());			
		} else {
			this._stat.add(update.delta);
		}

		if (this.entityType() === EntityType.PLAYER && update.entity) {
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
				this._logBuffer.clear();
				return [log, true];
			}
		}

		return [null, false];
	}
}