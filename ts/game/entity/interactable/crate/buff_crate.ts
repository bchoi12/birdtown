
import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Crate } from 'game/entity/interactable/crate'
import { CubeParticle } from 'game/entity/particle/cube_particle'
import { TextParticle } from 'game/entity/particle/text_particle'
import { Player } from 'game/entity/bird/player'
import { ColorType, MaterialType } from 'game/factory/api'
import { BuffFactory } from 'game/factory/buff_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EquipFactory } from 'game/factory/equip_factory'

import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'

export class BuffCrate extends Crate {

	private _particleLimiter : RateLimiter;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BUFF_CRATE, entityOptions);

		this._particleLimiter = new RateLimiter(1200);
	}

	override outerMaterial() : MaterialType { return MaterialType.PICKUP_PURPLE; }

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.type() !== EntityType.PLAYER) {
			return;
		}

		const player = <Player>entity;

		if (player.isLakituTarget() && interactable) {
			ui.showTooltip(TooltipType.BUFF_CRATE, {
				names: [],
				ttl: 500,
			});
		}
	}
	override interactWith(entity : Entity) : void {
		if (this.opened()) {
			return;
		}

		if (this.isSource()) {
			entity.addBuff(BuffFactory.getTemporary(), 1);
		}		
		this.open();
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const millis = stepData.millis;

		if (this._particleLimiter.check(millis)) {
			const pos = this.profile().pos();
			const width = this.profile().dim().x;
			const size = 0.2
			const [cube, hasCube] = this.addEntity<CubeParticle>(EntityType.ENERGY_CUBE_PARTICLE, {
				offline: true,
				ttl: 1200,
				profileInit: {
					pos: {
						x: pos.x + Fns.randomNoise(width / 2),
						y: pos.y,
					},
					vel: {
						x: Fns.randomNoise(0.03),
						y: 0.08,
					},
					angle: Math.PI * Math.random(),
				},
				modelInit: {
					transforms: {
						scale: { x: size, y: size, z: size },
					},
					materialType: MaterialType.PARTICLE_PURPLE,
				}
			});
		}
	}
}