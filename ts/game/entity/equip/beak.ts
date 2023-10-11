import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { Model } from 'game/component/model'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

enum Animation {
	IDLE = "Idle",
	SQUAWK = "Squawk",
}

export abstract class Beak extends Equip<Player> {

	private static readonly _animations = new Set<string>([Animation.IDLE, Animation.SQUAWK]);

	private _squawking : boolean;

	private _model : Model;

	constructor(entityType : EntityType, options : EntityOptions) {
		super(entityType, options);
		this.addType(EntityType.BEAK);

		this._squawking = false;

		this.addProp<boolean>({
			export: () => { return this._squawking; },
			import: (obj : boolean) => { this._squawking = obj; },
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

	override attachType() : AttachType { return AttachType.BEAK; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		this._squawking = this.key(KeyType.MOUSE_CLICK, KeyState.DOWN);
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
}