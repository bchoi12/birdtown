
import { game } from 'game'

import { Component, ComponentBase } from 'game/component'
import { ComponentType, AssociationType, EmotionType } from 'game/component/api'
import { ChangeLog } from 'game/component/util/change_log'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { StatType } from 'game/factory/api'

import { Fns } from 'util/fns'
import { RingBuffer } from 'util/buffer/ring_buffer'
import { Optional } from 'util/optional'

export type ResourceUpdate = {
	delta : number;
	entity? : Entity;
}

export class Resource extends ComponentBase implements Component {

	private static readonly _bufferSize : number = 10;

	protected _statType : StatType;
	protected _resource : number;

	protected _min : Optional<number>;
	protected _max : Optional<number>;
	protected _logBuffer : Optional<RingBuffer<ChangeLog>>;

	constructor(statType : StatType) {
		super(ComponentType.RESOURCE);

		this._statType = statType;
		this._resource = 0;

		this._min = new Optional();
		this._max = new Optional();
		this._logBuffer = new Optional();

		this.addProp<number>({
			export: () => { return this._resource; },
			import: (obj : number) => { this.importResource(obj); },
		});
	}

	override initialize() : void {
		super.initialize();

		this._resource = this.getStat();
	}

	get() : number { return this._resource; }
	set(value : number) : void { this._resource = value; }
	reset() : void { this._resource = this.getStat(); }
	percent() : number {return this.initialized() ? this._resource / this.getStat() : 0; }
	atMin() : boolean { return this._min.has() && this._resource <= this._min.get(); }
	atMax() : boolean { return this._max.has() && this._resource >= this._max.get(); }
	protected getStat() : number { return this.initialized() ? this.entity().getStat(this._statType) : 0; }

	updateResource(update : ResourceUpdate) : void {
		if (!this.isSource() || !this.initialized()) {
			return;
		}

		if (this._min.has() && this._resource + update.delta < this._min.get()) {
			update.delta = Fns.clamp(-this._resource, update.delta, this._min.get());
			this._resource = this._min.get();
		} else if (this._max.has() && this._resource + update.delta > this._max.get()) {
			update.delta = Fns.clamp(0, update.delta, this._max.get() - this._resource);
			this._resource = this._max.get();
		} else {
			this._resource += update.delta;
		}

		this.processDelta(update.delta);
		if (this.logUpdate(update)) {
			if (!this._logBuffer.has()) {
				this._logBuffer.set(new RingBuffer(Resource._bufferSize));
			}

			this._logBuffer.get().push(new ChangeLog({
				timestamp: Date.now(),
				delta: update.delta,
				entity: update.entity,	
			}));
		}
	}
	protected logUpdate(update : ResourceUpdate) : boolean { return false; }
	protected importResource(value : number) : void {
		const delta = value - this._resource;
		this.processDelta(delta);

		this._resource = value;
	}
	protected processDelta(delta : number) : void {}

	flush(pick : (log : ChangeLog) => boolean, stop : (log : ChangeLog) => boolean) : [ChangeLog, boolean] {
		if (!this._logBuffer.has()) {
			return [null, false];
		}

		while(!this._logBuffer.get().empty()) {
			const log = this._logBuffer.get().pop();
			if (stop(log)) {
				break;
			}

			if (pick(log)) {
				this._logBuffer.get().clear();
				return [log, true];
			}
		}

		return [null, false];
	}
}