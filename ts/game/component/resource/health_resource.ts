
import { game } from 'game'
import { ComponentType, EmotionType } from 'game/component/api'
import { Resource, ResourceUpdate } from 'game/component/resource'
import { EntityType } from 'game/entity/api'
import { TextParticle } from 'game/entity/particle/text_particle'
import { ColorType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'

import { settings } from 'settings'

import { Fns } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec } from 'util/vector'

export class HealthResource extends Resource {

	private static readonly _textHeight = 0.8;

	private _regenTimer : Timer;

	constructor() {
		super(StatType.HEALTH);

		this._min.set(0);

		this._regenTimer = this.newTimer({
			canInterrupt: true,
		});
	}

	override initialize() : void {
		super.initialize();

		this._min.set(0);
		this._max.set(this.getStat());
	}

	override reset() : void {
		super.reset();

		const stat = this.getStat();
		this.set(stat);
		this._min.set(0);
		this._max.set(stat);
	}

	protected override getStat() : number { return super.getStat() * Math.max(0.1, (1 + this.entity().getStat(StatType.HEALTH_BOOST))); }

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this.entity().getStat(StatType.HP_REGEN) === 0 || this._resource <= 0) {
			this._regenTimer.reset();
			return;
		}

		if (this._regenTimer.done()) {
			this.updateResource({
				delta: this.entity().getStat(StatType.HP_REGEN),
			});
			this._regenTimer.start(1000);
		} else if (!this._regenTimer.hasTimeLeft()) {
			this._regenTimer.start(this.entity().getStat(StatType.HP_REGEN_DELAY));
		}
	}

	setHealthPercent(percent : number) : void {
		this.set(percent * this.getStat());
	}

	protected override logUpdate(update : ResourceUpdate) : boolean {
		return update.delta < 0
			&& this.entity().hasType(EntityType.PLAYER)
			&& update.from
			&& this.entity().id() !== update.from.id();
	}

	protected override processDelta(delta : number) : void {
		if (delta === 0 || !this.initialized() || Number.isNaN(delta)) {
			return;
		}

		if (delta < 0) {
			this.entity().emote(EmotionType.SAD);

			if ((this._regenTimer.hasTimeLeft() || this._regenTimer.done()) && this.entity().hasStat(StatType.HP_REGEN_DELAY)) {
				this._regenTimer.start(this.entity().getStat(StatType.HP_REGEN_DELAY));
			}
		}

		if (!settings.showDamageNumbers()) {
			return;
		}

		if (!this.entity().hasProfile()) {
			return;
		}

		let pos = this.entity().profile().pos();

		let weight = 0;
		if (this.entityType() === EntityType.PLAYER) {
			weight = Fns.normalizeRange(10, Math.abs(delta), 100);
		} else if (this.entity().hasType(EntityType.ENEMY)) {
			weight = 2 * Fns.normalizeRange(10, Math.abs(delta), 100);
		}

		weight *= this.entity().getStat(StatType.SCALING);

		if (game.lakitu().inFOV(pos)) {
			let height = HealthResource._textHeight;
			if (this.entity().hasType(EntityType.PLAYER)) {
				height += weight;
			}

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
						text: "" + Math.abs(Math.min(-1, Math.round(delta))),
						height: height,
						textColor: ColorFactory.toString(ColorType.TEXT_RED),
						renderOnTop: true,
					});
				} else {
					particle.setText({
						text: "+" + Math.max(1, Math.round(delta)),
						height: height,
						textColor: ColorFactory.toString(ColorType.TEXT_GREEN),
						renderOnTop: true,
					});
				}
			}
		}
	}
}