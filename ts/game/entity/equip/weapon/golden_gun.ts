
import * as BABYLON from '@babylonjs/core/Legacy/legacy'


import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { GoldenBullet } from 'game/entity/projectile/golden_bullet'
import { Weapon, WeaponState, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec3 } from 'util/vector'

export class GoldenGun extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.GOLDEN_GUN, options);

		this.soundPlayer().registerSound(SoundType.GOLDEN_GUN);
	}

	override initialize() : void {
		super.initialize();

		this._model.applyToMeshes((mesh : BABYLON.Mesh) => {
			if (mesh.material && mesh.material instanceof BABYLON.PBRMaterial) {
				// mesh.material.metallic = 1;
				mesh.material.albedoColor = new BABYLON.Color3(1.0, 0.87, 0.47);
				mesh.material.reflectivityColor = new BABYLON.Color3(1, 1, 1);
			}
		});
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override hudType() : HudType { return HudType.GOLDEN; }
	override recoilType() : RecoilType { return RecoilType.WHIP; }
	override meshType() : MeshType { return MeshType.GOLDEN_GUN; }
	override reloadType() : ReloadType { return ReloadType.SPIN; }
	override reloadSound() : SoundType { return SoundType.QUICK_RELOAD; }
	protected override reloadSpins() : number { return 4; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const unitDir = this.getDir();

		this.addEntity<GoldenBullet>(EntityType.GOLDEN_BULLET, this.getProjectileOptions(pos, unitDir, unitDir.angleRad()));

		this.soundPlayer().playFromEntity(SoundType.GOLDEN_GUN, this.owner());
	}

}
