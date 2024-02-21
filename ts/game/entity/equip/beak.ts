import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { SoundPlayer } from 'game/component/sound_player'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType, SoundType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { Timer} from 'util/timer'

enum Animation {
	IDLE = "Idle",
	SQUAWK = "Squawk",
}

export abstract class Beak extends Equip<Player> {

	private static readonly _animations = new Set<string>([Animation.IDLE, Animation.SQUAWK]);
	private static readonly _squawkCooldown = 1000;

	private _squawking : boolean;
	private _squawkTimer : Timer;

	private _model : Model;
	private _soundPlayer : SoundPlayer;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BEAK);

		this._squawking = false;
		this._squawkTimer = this.newTimer({
			canInterrupt: false,
		});

		this.addProp<boolean>({
			export: () => { return this._squawking; },
			import: (obj : boolean) => { this.setSquawking(obj); },
			options: {
				filters: GameData.udpFilters,
			},
		});

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(this.meshType(), (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];

					result.animationGroups.forEach((animationGroup : BABYLON.AnimationGroup) => {
						if (Beak._animations.has(animationGroup.name)) {
							model.registerAnimation(animationGroup, /*group=*/0);
						}
					});
					model.stopAllAnimations();

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._soundPlayer = this.addComponent<SoundPlayer>(new SoundPlayer());
		this._soundPlayer.registerSound(SoundType.BAWK, SoundType.BAWK);
	}

	abstract meshType() : MeshType;

	override attachType() : AttachType { return AttachType.BEAK; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this.isSource()) {
			return;
		}

		this.setSquawking(this.key(KeyType.SQUAWK, KeyState.DOWN));
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) { return; }

		if (this._squawking || this._owner.dead()) {
			this._model.playAnimation(Animation.SQUAWK);
		} else {
			this._model.playAnimation(Animation.IDLE);
		}
	}

	private setSquawking(squawking : boolean) : void {
		if (this._squawking === squawking) {
			return;
		}
		if (this._squawkTimer.hasTimeLeft()) {
			return;
		}
		this._squawking = squawking;

		if (this._squawking) {
			this._soundPlayer.onEnded(SoundType.BAWK).addOnce(() => {
				this._squawking = false;
			});
			this._soundPlayer.playFromSelf(SoundType.BAWK);
			this._squawkTimer.start(Beak._squawkCooldown);
		}
	}
}