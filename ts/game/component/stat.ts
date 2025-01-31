
import { game } from 'game'

import { Component, ComponentBase } from 'game/component'
import { ComponentType, AssociationType, EmotionType, StatType } from 'game/component/api'
import { StatLog } from 'game/component/util/stat_log'
import { StatNumber } from 'game/component/util/stat_number'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { TextParticle } from 'game/entity/particle/text_particle'
import { ColorType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { settings } from 'settings'

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { RingBuffer } from 'util/buffer/ring_buffer'
import { Vec } from 'util/vector'

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

	private static readonly _logTypes = new Set([
		StatType.HEALTH,
	]);
	private static readonly _showTypes = new Set([
		StatType.HEALTH,
	]);
	private static readonly _nonPlayerTextHeight = 0.7;
	private static readonly _bufferSize : number = 10;

	private _statType : StatType;
	private _stat : StatNumber;
	private _min : number;
	private _max : StatNumber;
	private _logBuffer : RingBuffer<StatLog>;

	constructor(type : StatType, init : StatInitOptions) {
		super(ComponentType.STAT);

		this._statType = type;
		this._stat = new StatNumber(init.base);
		this._min = init.min;
		this._max = new StatNumber(init.max);
		this._logBuffer = new RingBuffer(Stat._bufferSize);

		this.addProp<number>({
			export: () => { return this._stat.get(); },
			import: (obj : number) => { this.importStat(obj); },
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
	set(value : number) : void { this._stat.set(value); }
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

		if (Stat._showTypes.has(this._statType)) {
			this.publishDelta(update.delta);
		}

		if (this.logUpdate(update)) {
			this._logBuffer.push(new StatLog({
				timestamp: Date.now(),
				delta: update.delta,
				entity: update.entity,	
			}));
		}
	}
	private logUpdate(update : StatUpdate) : boolean {
		return Stat._logTypes.has(this._statType)
			&& update.delta < 0
			&& this.entity().allTypes().has(EntityType.PLAYER)
			&& update.entity
			&& this.entity().id() !== update.entity.id()
	}
	private importStat(value : number) : void {
		const delta = value - this.current();
		this.publishDelta(delta);

		this._stat.set(value)
	}
	private publishDelta(delta : number) : void {
		if (delta === 0 || !this.initialized() || delta >= this.max() - this.min()) {
			return;
		}

		if (delta < 0) {
			this.entity().emote(EmotionType.SAD);
		}

		if (!settings.showDamageNumbers()) {
			return;
		}

		let pos : Vec;
		if (this.entity().hasProfile()) {
			pos = this.entity().profile().pos();
		} else {
			return;
		}

		let weight = 0;
		if (this.entityType() === EntityType.PLAYER) {
			weight = Fns.normalizeRange(10, Math.abs(delta), 50);
		}

		if (game.lakitu().inFOV(pos, /*buffer=3*/)) {
			const height = this.entity().allTypes().has(EntityType.PLAYER) ? 0.7 + weight * 0.5 : Stat._nonPlayerTextHeight;

			const [particle, hasParticle] = this.entity().addEntity<TextParticle>(EntityType.TEXT_PARTICLE, {
				offline: true,
				ttl: 800 + 400 * weight,
				profileInit: {
					pos: pos,
					vel: { x: 0, y: 0.025 + 0.01 * weight },
				},
			});

			if (hasParticle) {
				if (delta < 0) {
					particle.setText({
						text: "" + delta,
						height: height,
						textColor: ColorFactory.toString(ColorType.TEXT_RED),
						renderOnTop: true,
					});
				} else {
					particle.setText({
						text: "+" + delta,
						height: height,
						textColor: ColorFactory.toString(ColorType.TEXT_GREEN),
						renderOnTop: true,
					});
				}
			}
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