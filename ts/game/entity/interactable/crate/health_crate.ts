
import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Crate } from 'game/entity/interactable/crate'
import { TextParticle } from 'game/entity/particle/text_particle'
import { Player } from 'game/entity/player'
import { ColorType, MaterialType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EquipFactory } from 'game/factory/equip_factory'

import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

export class HealthCrate extends Crate {

	private _showHeart : boolean;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.HEALTH_CRATE, entityOptions);

		this._showHeart = false;

		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.PICKUP_RED).toString(),
		});

		this.addProp<boolean>({
			has: () => { return this._showHeart; },
			export: () => { return this._showHeart; },
			import: (obj : boolean) => { this._showHeart = obj; },
		})
	}

	override outerMaterial() : MaterialType { return MaterialType.PICKUP_RED; }

	amount() : number { return 10; }

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.type() !== EntityType.PLAYER) {
			return;
		}

		const player = <Player>entity;

		if (player.isLakituTarget() && interactable) {
			ui.showTooltip(TooltipType.HEALTH_CRATE, {
				names: ["" + this.amount()],
				ttl: 500,
			});
		}
	}
	override interactWith(entity : Entity) : void {
		if (this.opened()) {
			return;
		}

		entity.takeDamage(-Math.max(0.05 * entity.maxHealth(), this.amount()), this, this);
		this._showHeart = true;
		this.open();
	}

	override open() : void {
		super.open();

		if (!this._showHeart) {
			return;
		}

		const [particle, hasParticle] = this.addEntity<TextParticle>(EntityType.TEXT_PARTICLE, {
			offline: true,
			ttl: 750,
			profileInit: {
				pos: this._profile.pos(),
				vel: { x: 0, y: 0.02 },
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