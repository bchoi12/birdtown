import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { Vec, Vec2 } from 'util/vector'

enum Animation {
	FLYING = "Flying",
	ON = "On",
}

export class Plane extends EntityBase implements Entity {

	private static readonly _animations = new Set<string>([Animation.FLYING, Animation.ON]);

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLANE, entityOptions);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.PLANE, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];

					result.animationGroups.forEach((animationGroup : BABYLON.AnimationGroup) => {
						if (Plane._animations.has(animationGroup.name)) {
							model.registerAnimation(animationGroup);
						}
					});
					model.playAnimation(Animation.FLYING, /*loop=*/true);
					model.playAnimation(Animation.ON, /*loop=*/true);

					model.setMesh(mesh);
				});
			},
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.dim(), {
					isSensor: true,
					render: {
						visible: false,
					},
				});
			},
			init: entityOptions.profileInit,
		}));

		this._profile.setVel({x: 0, y: 0});
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		const bounds = game.level().bounds();
		const side = bounds.xSide(this._profile.pos());

		if (this._profile.vel().isZero()) {
			if (side === 0) {
				this._profile.vel().x = .05;
			}
			return;
		}

		// Turn around
		if (side !== 0) {
			this._profile.vel().x = -1 * side * Math.abs(this._profile.vel().x);
		}

		// Rotate to match velocity direction
		if (this._profile.vel().x > 0) {
			this._model.rotation().y = Math.min(0, this._model.rotation().y + 3 * millis / 1000);
		} else {
			this._model.rotation().y = Math.max(-Math.PI, this._model.rotation().y - 3 * millis / 1000);
		}
	}
}