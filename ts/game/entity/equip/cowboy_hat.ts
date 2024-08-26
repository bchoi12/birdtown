import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { SoundPlayer } from 'game/component/sound_player'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Weapon } from 'game/entity/equip/weapon'
import { Player } from 'game/entity/player'
import { MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { KeyType, KeyState, CounterOptions } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class CowboyHat extends Equip<Player> {

	private static readonly _chargeDelay = 600;
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
	}

	override attachType() : AttachType { return AttachType.HEAD; }

	override getCounts() : Map<CounterType, CounterOptions> {
		let counts = super.getCounts();
		let percent = this._juice / CowboyHat._maxJuice;
		counts.set(CounterType.ROLL, {
			percentGone: 1 - percent,
			text: Math.floor(percent) + "/1",
			color: ColorFactory.cowboyBrown.toString(),
		});
		return counts;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const millis = stepData.millis;

		const weapons = this.owner().equips().findAll((equip : Equip<Player>) => {
			return equip.allTypes().has(EntityType.WEAPON) && equip.initialized();
		});

		if (this.canDash() && this.key(KeyType.ALT_MOUSE_CLICK, KeyState.PRESSED)) {
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
		}

		if (!this._chargeDelayTimer.hasTimeLeft()) {
			this._juice = Math.min(CowboyHat._maxJuice, this._juice + 0.5 * CowboyHat._maxJuice * millis / 1000);
		}
	}

	override preRender() : void {
		super.preRender();

		this.owner().model().rotation().z = -this._dir * 2 * Math.PI * this._dashTimer.percentElapsed();
	}

	private canDash() : boolean { return this._juice >= CowboyHat._maxJuice && !this._dashTimer.hasTimeLeft(); }

}