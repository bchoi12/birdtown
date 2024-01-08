import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { CounterType, KeyType, KeyState } from 'ui/api'

import { Fns } from 'util/fns'
import { Timer} from 'util/timer'
import { Vec2 } from 'util/vector'

export class Jetpack extends Equip<Player> {

	private static readonly _fireMeshName = "fire";
	private static readonly _maxJuice = 100;
	private static readonly _chargeDelay = 500;

	private static readonly _maxAcc = 5;
	private static readonly _ownerMaxVel = 0.3;

	private _enabled : boolean;
	private _juice : number;
	private _canChargeTimer : Timer;
	private _canCharge : boolean;

	private _fire : BABYLON.Mesh;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.JETPACK, entityOptions);

		this._enabled = false;
		this._juice = 0;
		this._canChargeTimer = this.newTimer({
			canInterrupt: true,
		});
		this._canCharge = false;

		this._fire = null;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.JETPACK, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];

					result.meshes.forEach((fireMesh : BABYLON.Mesh) => {
						if (fireMesh.name === Jetpack._fireMeshName) {
							this._fire = fireMesh;
						}
					});

					if (this._fire === null) {
						console.error("Error: jetpack model missing fire");
						this.delete();
						return;
					}

					this._fire.scaling.y = 0;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.addProp<boolean>({
			export: () => { return this._enabled; },
			import: (obj : boolean) => { this._enabled = obj; },
		});
		this.addProp<number>({
			export: () => { return this._juice; },
			import: (obj : number) => { this._juice = obj; },
		});
	}

	override displayName() : string { return "jetpack"; }
	override attachType() : AttachType { return AttachType.BACK; }

	override initialize() : void {
		super.initialize();

		this._juice = Jetpack._maxJuice;
	}
	
	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		this._enabled = false;
		if (this._juice > 0 && this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this._juice = Math.max(this._juice - millis / 8, 0);

			this._enabled = true;
			this._canCharge = false;
			this._canChargeTimer.start(Jetpack._chargeDelay);

			let ownerProfile = this.owner().profile();
			ownerProfile.addVel({ y: this.computeAcc(ownerProfile.vel().y) * millis / 1000, });
		} else {
			if (this.owner().getAttribute(AttributeType.GROUNDED) || !this._canChargeTimer.hasTimeLeft()) {
				this._canCharge = true;
			}
		}

		if (this._canCharge) {
			if (this.owner().getAttribute(AttributeType.GROUNDED)) {
				this._juice += millis / 5;
			} else {
				this._juice += millis / 20;
			}

			this._juice = Math.min(this._juice, Jetpack._maxJuice);
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._enabled) {
			this._fire.scaling.y = 1 + 3 * Math.random();
		} else {
			this._fire.scaling.y = 0;
		}
	}

	override getCounts() : Map<CounterType, number> {
		return new Map([
			[CounterType.JUICE, Math.ceil(this._juice)],
		]);
	}

	private computeAcc(currentVel : number) : number {
		return Jetpack._maxAcc * Fns.clamp(0, (Jetpack._ownerMaxVel - currentVel) / (2 * Jetpack._ownerMaxVel), 1);
	}
}