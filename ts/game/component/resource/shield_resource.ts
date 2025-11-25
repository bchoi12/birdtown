
import { game } from 'game'
import { ComponentType, EmotionType } from 'game/component/api'
import { Resource, ResourceUpdate } from 'game/component/resource'
import { EntityType } from 'game/entity/api'
import { ShieldRing } from 'game/entity/equip/shield_ring'
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

	private _ring : ShieldRing;

	constructor() {
		super(StatType.SHIELD);

		this._min.set(0);

		this._ring = null;
	}

	override initialize() : void {
		super.initialize();

		this.reset();
	}

	override delete() : void {
		super.delete();

		this.deleteRing();
	}

	override reset() : void {
		super.reset();

		const stat = this.getStat();
		this._min.set(0);
		this._max.set(stat);
		this.set(stat);
	}

	override set(value : number) : void {
		super.set(value);

		this.updateRing(value);
	}

	private updateRing(shield : number) : void {
		if (shield <= 0) {
			this.deleteRing();
			return;
		}

		if (this._ring !== null) {
			if (this._ring.valid()) {
				this._ring.setShield(shield);
				return;
			} else {
				this._ring.delete();
			}
		}

		let ok = false;
		[this._ring, ok] = game.entities().addEntity<ShieldRing>(EntityType.SHIELD_RING, {
			associationInit: {
				owner: this.entity(),
			},
			offline: true,
		});

		if (ok) {
			this._ring.setShield(shield);
		}
	}

	private deleteRing() : void {
		if (this._ring === null) {
			return;
		}

		this._ring.delete();
		this._ring = null;
	}

	protected override preprocessUpdate(update : ResourceUpdate) : void {
		super.preprocessUpdate(update);
	}

	protected override processDelta(delta : number) : void {
		if (this._ring === null && this.get() > 0) {
			this.updateRing(this.get());
		} else if (this._ring !== null && this.get() <= 0) {
			this.deleteRing();
		}

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