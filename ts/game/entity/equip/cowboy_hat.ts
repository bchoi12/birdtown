import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { SoundPlayer } from 'game/component/sound_player'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Weapon, WeaponState } from 'game/entity/equip/weapon'
import { Player } from 'game/entity/player'
import { ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class CowboyHat extends Equip<Player> {

	private static readonly _chargeDelay = 600;
	private static readonly _cooldown = 1500;
	private static readonly _dashTime = 275;
	private static readonly _maxJuice = 100;

	private _chargeDelayTimer : Timer;
	private _dashTimer : Timer;
	private _juice : number;
	private _dir : number;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.COWBOY_HAT, entityOptions);

		this._chargeDelayTimer = this.newTimer({
			canInterrupt: true,
		});
		this._dashTimer = this.newTimer({
			canInterrupt: false,
		});
		this._juice = CowboyHat._maxJuice;
		this._dir = 0;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.COWBOY_HAT, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.RELOAD);
	}

	override attachType() : AttachType { return AttachType.HEAD; }

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();
		let percent = this._juice / CowboyHat._maxJuice;
		hudData.set(HudType.ROLL, {
			charging: percent < 1,
			percentGone: 1 - percent,
			empty: true,
			color: this.clientColorOr(ColorFactory.color(ColorType.WESTERN_BROWN).toString()),
			keyType: KeyType.ALT_MOUSE_CLICK,
		});
		return hudData;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const millis = stepData.millis;

		const weapons = this.owner().equips().findAll((equip : Equip<Player>) => {
			return equip.allTypes().has(EntityType.WEAPON) && equip.initialized();
		});

		if (this.canDash() && this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this.owner().profile().setVel({x: 0, y: 0});

			let force = this.inputDir().clone().scale(0.6);
			this._dir = force.x === 0 ? 1 : Math.sign(force.x);

			// Only allow source to dash since otherwise it's jittery.
			if (this.isSource()) {
				this.owner().addForce(force);
			}

			weapons.forEach((weapon : Weapon) => {
				weapon.quickReload(CowboyHat._dashTime);
			});

			this._juice = Math.max(0, this._juice - CowboyHat._maxJuice);
			this._chargeDelayTimer.start(CowboyHat._chargeDelay);
			this._dashTimer.start(CowboyHat._dashTime);

			this.soundPlayer().playFromEntity(SoundType.RELOAD, this.owner());
		}

		if (!this._chargeDelayTimer.hasTimeLeft()) {
			this._juice = Math.min(CowboyHat._maxJuice, this._juice + CowboyHat._maxJuice * millis / CowboyHat._cooldown);
		}
	}

	override preRender() : void {
		super.preRender();

		this.owner().model().rotation().z = -this._dir * 2 * Math.PI * this._dashTimer.percentElapsed();
	}

	private canDash() : boolean { return this._juice >= CowboyHat._maxJuice && !this._dashTimer.hasTimeLeft(); }

}