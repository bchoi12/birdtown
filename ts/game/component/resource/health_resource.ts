
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
import { RateLimiter } from 'util/rate_limiter'
import { Timer } from 'util/timer'
import { Vec } from 'util/vector'

export class HealthResource extends Resource {

	private static readonly _textHeight = 0.8;
	private static readonly _particleInterval = 200;

	private _regenTimer : Timer;
	private _deltaBuffer : Array<number>;
	private _particleRateLimiter : RateLimiter;

	constructor() {
		super(StatType.HEALTH);

		this._min.set(0);

		this._regenTimer = this.newTimer({
			canInterrupt: true,
		});
		// TODO: make this NumberRingBuffer if performance suffers
		this._deltaBuffer = new Array();
		this._particleRateLimiter = new RateLimiter(HealthResource._particleInterval);
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

	protected override getStat() : number {
		if (!this.isSource()) {
			return super.getStat();
		}

		return super.getStat() * Math.max(0.1, (1 + this.entity().getStat(StatType.HEALTH_BOOST)));
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this._particleRateLimiter.check(stepData.millis) && this._deltaBuffer.length > 0) {
			this.displayDelta(this._deltaBuffer.pop());
		}

		if (this.entity().getStat(StatType.HP_REGEN) === 0 || this._resource <= 0 || this.entity().dead()) {
			this._regenTimer.reset();
			return;
		}

		if (this._regenTimer.done()) {
			this.updateResource({
				delta: Math.max(1, Math.round(this.entity().maxHealth() * this.entity().getStat(StatType.HP_REGEN))),
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
			&& this.entity().hasType(EntityType.BIRD)
			&& update.from
			&& update.from.hasType(EntityType.PLAYER)
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

		if (!this.entity().hasProfile()) {
			return;
		}

		if (this.entity().dead() && delta < 0) {
			return;
		}

		this._deltaBuffer.push(delta);
	}

	private displayDelta(delta : number) : void {
		let pos = this.entity().profile().pos();

		if (!game.lakitu().inFOV(pos)) {
			return;
		}

		if (settings.showDamageNumbers()) {
			let weight = 0;
			if (this.entity().hasType(EntityType.BIRD)) {
				weight = Fns.normalizeRange(10, Math.abs(delta), 100) * this.entity().getStat(StatType.SCALING);
			}

			let height = HealthResource._textHeight + weight;

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

			return;
		}

		if (delta > 0) {
			const [particle, hasParticle] = this.entity().addEntity<TextParticle>(EntityType.TEXT_PARTICLE, {
				offline: true,
				ttl: 750,
				profileInit: {
					pos: pos,
					vel: { x: 0, y: 0.03 },
				},
			});

			if (hasParticle) {
				particle.setText({
					text: "❤️",
					height: 1,
					textColor: ColorFactory.toString(ColorType.RED),
				});
			}
		}
	}
}