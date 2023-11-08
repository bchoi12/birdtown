import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { SoundType } from 'game/system/api'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { Timer, InterruptType } from 'util/timer'

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

	constructor(entityType : EntityType, options : EntityOptions) {
		super(entityType, options);
		this.addType(EntityType.BEAK);

		this._squawking = false;
		this._squawkTimer = this.newTimer({
			interrupt: InterruptType.UNSTOPPABLE,
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
		}));
	}

	abstract meshType() : MeshType;
	abstract soundType() : SoundType;

	override attachType() : AttachType { return AttachType.BEAK; }

	override key(type : KeyType, state : KeyState) : boolean {
		if (!this.hasOwner()) { return false; }

		if (this.owner().dead()) { return false; }

		return super.key(type, state);
	}

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

		if (this._squawking) {
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
			game.audio().loadSound(this.soundType(), (sound : BABYLON.Sound) => {
				if (this._model.hasMesh()) {
					sound.attachToMesh(this._model.mesh());
				} else if (this.owner().hasProfile()) {
					sound.setPosition(this.owner().profile().pos().toBabylon3());
				}
				sound.play();
			}, () => {
				this._squawking = false;
			});
			this._squawkTimer.start(Beak._squawkCooldown);
		}
	}
}