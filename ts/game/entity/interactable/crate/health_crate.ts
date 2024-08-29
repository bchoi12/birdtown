
import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Crate } from 'game/entity/interactable/crate'
import { Player } from 'game/entity/player'
import { MaterialType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EquipPairs } from 'game/util/equip_pairs'

import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

export class HealthCrate extends Crate {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.HEALTH_CRATE, entityOptions);

		this._profile.setMinimapOptions({
			color: ColorFactory.crateRed.toString(),
		})
	}

	override outerMaterial() : MaterialType { return MaterialType.CRATE_RED; }

	amount() : number { return 10; }

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.type() !== EntityType.PLAYER) {
			return;
		}

		const player = <Player>entity;

		if (player.isLakituTarget() && interactable) {
			ui.showTooltip(TooltipType.HEALTH_CRATE, {
				ttl: 500,
				names: ["" + this.amount()],
			});
		}
	}
	override interactWith(entity : Entity) : void {
		if (this.opened()) {
			return;
		}

		entity.takeDamage(-this.amount(), this);
		this.open();

		if (this.isSource()) {
			this.delete();
		}
	}
}