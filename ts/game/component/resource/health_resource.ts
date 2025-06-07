
import { game } from 'game'
import { ComponentType, EmotionType } from 'game/component/api'
import { Resource, ResourceUpdate } from 'game/component/resource'
import { EntityType } from 'game/entity/api'
import { TextParticle } from 'game/entity/particle/text_particle'
import { ColorType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { settings } from 'settings'

import { Fns } from 'util/fns'
import { Vec } from 'util/vector'

export class HealthResource extends Resource {

	private static readonly _textHeight = 0.8;

	constructor() {
		super(StatType.HEALTH);

		this._min.set(0);
	}

	override initialize() : void {
		super.initialize();

		this._min.set(0);
		this._max.set(this.getStat());
	}

	override reset() : void {
		super.reset();

		this.set(this.getStat());
		this._min.set(0);
		this._max.set(this.getStat());
	}

	setHealthPercent(percent : number) : void {
		this.set(percent * this.getStat());
	}

	protected override logUpdate(update : ResourceUpdate) : boolean {
		return update.delta < 0
			&& this.entity().allTypes().has(EntityType.PLAYER)
			&& update.entity
			&& this.entity().id() !== update.entity.id();
	}

	protected override processDelta(delta : number) : void {
		if (delta === 0 || !this.initialized()) {
			return;
		}

		if (delta < 0) {
			this.entity().emote(EmotionType.SAD);
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
			weight = Fns.normalizeRange(10, Math.abs(delta), 50);
		}

		if (game.lakitu().inFOV(pos)) {
			let height = HealthResource._textHeight;
			if (this.entity().allTypes().has(EntityType.PLAYER)) {
				height += 0.5 * weight;
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
}