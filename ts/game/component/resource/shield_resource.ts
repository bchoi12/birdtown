
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

export class ShieldResource extends Resource {

	private static readonly _textHeight = 0.8;

	constructor() {
		super(StatType.SHIELD);

		this._min.set(0);
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

	protected override preprocessUpdate(update : ResourceUpdate) : void {
		super.preprocessUpdate(update);
	}

	protected override processDelta(delta : number) : void {
		if (!settings.showDamageNumbers()) {
			return;
		}
		if (delta >= 0 || !this.initialized() || Number.isNaN(delta)) {
			return;
		}
		if (!this.entity().hasProfile()) {
			return;
		}

		let pos = this.entity().profile().pos();
		let weight = this.entity().getStat(StatType.SCALING);

		if (game.lakitu().inFOV(pos)) {
			let height = ShieldResource._textHeight;

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
						textColor: ColorFactory.toString(ColorType.TEXT_GRAY),
						renderOnTop: true,
					});
				} else {
					particle.setText({
						text: "+" + Math.max(1, Math.round(delta)),
						height: height,
						textColor: ColorFactory.toString(ColorType.TEXT_GRAY),
						renderOnTop: true,
					});
				}
			}
		}
	}
}