import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import earcut from 'earcut'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { BoneType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Weapon, RecoilType } from 'game/entity/equip/weapon'
import { Player } from 'game/entity/player'
import { Knife } from 'game/entity/projectile/knife'
import { BuffType, ColorType, MaterialType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec2, Vec3 } from 'util/vector'

export class RedHeadband extends Equip<Player> {

	private static readonly _trailVertices = [
        new BABYLON.Vector3(0, 0, 0.4),
        new BABYLON.Vector3(-2, 0, 0),
        new BABYLON.Vector3(0, 0, -0.4),
	];

	private static readonly _dashTime = 300;

	private _dashTimer : Timer;
	private _trail : BABYLON.Mesh;
	private _dir : number;
	private _weapon : Weapon;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.RED_HEADBAND, entityOptions);

		this._dashTimer = this.newTimer({
			canInterrupt: true,
		});
		this._trail = BABYLON.MeshBuilder.ExtrudePolygon(this.name() + "-trail", {
			shape: RedHeadband._trailVertices,
			depth: 0.3,
		}, game.scene(), earcut);
		this._trail.rotation.x = Math.PI / 2;
		this._trail.rotation.y = -Math.PI / 2;
		this._trail.material = MaterialFactory.material(MaterialType.EASTERN_RED_TRAIL);
		this._trail.isVisible = false;
		this._dir = 0;
		this._weapon = null;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.RED_HEADBAND, (result : LoadResult) => {
					let mesh = result.mesh;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.DASH);
		this.soundPlayer().registerSound(SoundType.THROW);
	}

	override attachType() : AttachType { return AttachType.FOREHEAD; }
	protected override hudType() : HudType { return HudType.BACKFLIP;}
	override checkCanUse() : boolean { return super.checkCanUse() && this._weapon !== null; }

	override initialize() : void {
		super.initialize();

		this.owner().model().onLoad((model : Model) => {
			this._trail.attachToBone(model.getBone(BoneType.BACK), model.mesh());
		})
	}

	override delete() : void {
		super.delete();

		if (this.hasOwner()) {
			this.owner().setAttribute(AttributeType.DODGY, false);

			if (this.owner().hasModel()) {
				this.owner().model().rotation().z = 0;
			}
		}
	}

	override dispose() : void {
		super.dispose();

		this._trail.dispose();
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (this._weapon === null || !this._weapon.valid()) {
			const weapons = <Weapon[]>this.owner().equips().findN((equip : Equip<Player>) => {
				return equip.hasType(EntityType.WEAPON) && equip.valid();
			}, 1);

			if (weapons.length < 1) {
				this._weapon = null;
				return;
			}

			this._weapon = weapons[0];
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this.canUse() && this.useKeyPressed()) {
			this.recordUse();
		}

		if (this.owner().hasMaxedBuff(BuffType.DODGY)) {
			this.owner().setAttribute(AttributeType.DODGY, this._dashTimer.hasTimeLeft());
		}
	}

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		this._dashTimer.start(RedHeadband._dashTime);

		if (this.hasOwner()) {
			this.owner().profile().setVel({x: 0, y: 0});

			let force = this.inputDir().clone().scale(this.getStat(StatType.FORCE) * this.owner().getStat(StatType.SCALING));
			this.owner().addForce(force);
			this._dir = force.x === 0 ? 1 : Math.sign(force.x);

			if (this._weapon !== null && this._weapon.valid()) {
				const pos = this._weapon.shootPos();
				const unitDir = this._weapon.getDir();

				let vel = unitDir.clone().scale(this.getStat(StatType.PROJECTILE_SPEED));
				this.addEntity(EntityType.KNIFE, {
					ttl: this.getStat(StatType.PROJECTILE_TTL),
					associationInit: {
						owner: this.owner(),
					},
					profileInit: {
						pos: pos,
						vel: vel,
					},
				});
			}

			this.soundPlayer().playFromEntity(SoundType.DASH, this.owner());
			this.soundPlayer().playFromEntity(SoundType.THROW, this.owner());
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.owner().model().hasMesh()) {
			return;
		}

		if (this._dashTimer.hasTimeLeft()) {
			this._trail.isVisible = true;

			const weight = 1 - Fns.interp(InterpType.CUBIC, this._dashTimer.percentElapsed());
			this._trail.scaling.x = weight;
		} else {
			this._trail.isVisible = false;
		}

		this.owner().model().rotation().z = -this._dir * 2 * Math.PI * this._dashTimer.percentElapsed();
	}
}