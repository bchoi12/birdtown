
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

export class WeaponCrate extends Crate {

	private _index : number;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WEAPON_CRATE, entityOptions);

		this._index = 0;
		if (this.isSource()) {
			this._index = EquipPairs.randomIndex();
		}

		this.addProp<number>({
			export: () => { return this._index; },
			import: (obj : EntityType) => { this._index = obj; },
		});

		this._profile.setMinimapOptions({
			color: ColorFactory.crateBlue.toString(),
		})
	}

	equipType(playerEquipType : EntityType) : EntityType {
		return EquipPairs.getDefaultPairExcluding(this._index, playerEquipType)[0]
	}
	altEquipType(playerEquipType : EntityType) : EntityType {
		return EquipPairs.getDefaultPairExcluding(this._index, playerEquipType)[1];
	}
	equipList(playerEquipType : EntityType) : string {
		return StringFactory.getEntityTypeName(this.equipType(playerEquipType)).toString()
		+ " and "
		+ StringFactory.getEntityTypeName(this.altEquipType(playerEquipType)).toString();
	}

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.type() !== EntityType.PLAYER) {
			return;
		}

		const player = <Player>entity;

		if (player.isLakituTarget() && interactable) {
			ui.showTooltip(TooltipType.WEAPON_CRATE, {
				ttl: 500,
				names: [this.equipList(player.equipType())],
			});
		}
	}
	override interactWith(entity : Entity) : void {
		if (entity.type() !== EntityType.PLAYER || this.opened()) {
			return;
		}

		const player = <Player>entity;

		player.createEquips(this.equipType(player.equipType()), this.altEquipType(player.equipType()));

		this.open();

		if (this.isSource()) {
			this.delete();
		}
	}
}