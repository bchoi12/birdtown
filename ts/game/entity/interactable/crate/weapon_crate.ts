
import { game } from 'game'
import { StepData } from 'game/game_object'
import { ComponentType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Crate } from 'game/entity/interactable/crate'
import { Player } from 'game/entity/bird/player'
import { BuffType, ColorType, MaterialType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EquipFactory } from 'game/factory/equip_factory'
import { LoadoutType, WeaponSetType } from 'game/system/api'

import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

export class WeaponCrate extends Crate {

	private _equipType : EntityType;
	private _altEquipType : EntityType;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WEAPON_CRATE, entityOptions);

		this._equipType = EntityType.UNKNOWN;
		this._altEquipType = EntityType.UNKNOWN;

		if (this.isSource()) {
			const pair = EquipFactory.next();
			this._equipType = pair[0];

			if (game.controller().config().getWeaponSet() === WeaponSetType.ALL) {
				this._altEquipType = EquipFactory.getAltEquip(this._equipType);
			} else {
				this._altEquipType = pair[1];
			}
		}

		this.addProp<EntityType>({
			has: () => { return this._equipType !== EntityType.UNKNOWN; },
			export: () => { return this._equipType; },
			import: (obj : EntityType) => { this._equipType = obj; },
		});
		this.addProp<EntityType>({
			has: () => { return this._altEquipType !== EntityType.UNKNOWN; },
			export: () => { return this._altEquipType; },
			import: (obj : EntityType) => { this._altEquipType = obj; },
		});
	}

	override ready() : boolean { return super.ready() && this._equipType !== EntityType.UNKNOWN && this._altEquipType !== EntityType.UNKNOWN; }

	override outerMaterial() : MaterialType { return MaterialType.PICKUP_BLUE; }

	equipType() : EntityType { return this._equipType; }
	altEquipType() : EntityType { return this._altEquipType; }
	equipList() : string {
		return StringFactory.getEntityTypeName(this._equipType).toString()
		+ " and "
		+ StringFactory.getEntityTypeName(this._altEquipType).toString();
	}

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.type() !== EntityType.PLAYER) {
			return;
		}

		const player = <Player>entity;

		if (player.isLakituTarget() && !player.hasBuff(BuffType.VIP) && interactable) {
			ui.showTooltip(TooltipType.WEAPON_CRATE, {
				ttl: 500,
				names: [this.equipList()],
			});
		}
	}
	override interactWith(entity : Entity) : void {
		if (entity.type() !== EntityType.PLAYER || this.opened()) {
			return;
		}

		const player = <Player>entity;
		if (!player.hasBuff(BuffType.VIP)) {
			player.createEquips(this.equipType(), this.altEquipType());
		}

		this.open();
	}
}