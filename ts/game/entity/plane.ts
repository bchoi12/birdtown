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

import { SeededRandom } from 'util/seeded_random'
import { RateLimiter } from 'util/rate_limiter'
import { Vec, Vec2 } from 'util/vector'

enum Animation {
	FLYING = "Flying",
	ON = "On",
}

export class Plane extends EntityBase implements Entity {

	private static readonly _animations = new Set<string>([Animation.FLYING, Animation.ON]);
	private static readonly _speed = 0.2;
	private static readonly _turnRate = 3;
	private static readonly _crateSpawnInterval = 3000;

	private _crateSpawner : RateLimiter;
	private _rng : SeededRandom;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLANE, entityOptions);

		this._crateSpawner = new RateLimiter(Plane._crateSpawnInterval);

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
					model.playAnimation(Animation.FLYING, { loop: true });
					model.playAnimation(Animation.ON, { loop: true });

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.neverCollideFilter(),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setRenderNever();
		this._profile.setVel({x: Plane._speed, y: 0});
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		// Turn around
		if (!game.level().isCircle()) {
			const bounds = game.level().bounds();
			const side = bounds.xSide(this._profile.pos(), /*buffer=*/-this._profile.scaledDim().x);
			if (side !== 0) {
				this._profile.setVel({ x: -1 * side * Plane._speed });
			} else {
				this._profile.setVel({ x: Math.sign(this._profile.vel().x) * Plane._speed });
			}
		} else {
			this._profile.setVel({x: Plane._speed });
		}

		if (!this._model.hasMesh()) {
			return;
		}

		// Rotate to match velocity direction
		let rotation = this._model.mesh().rotation
		if (this._profile.vel().x > 0) {
			rotation.y = Math.min(0, rotation.y + Plane._turnRate * millis / 1000);
		} else {
			rotation.y = Math.max(-Math.PI, rotation.y - Plane._turnRate * millis / 1000);
		}

		if (this.isSource() && this._crateSpawner.check(millis)) {
			const numCrates = game.entities().getMap(EntityType.CRATE).numEntities();
			const numPlayers = game.entities().getMap(EntityType.PLAYER).numEntities();

			if (numCrates <= 2 * numPlayers + 8) {
				this.addEntity(EntityType.CRATE, {
					profileInit: {
						pos: this._profile.pos().clone().add({ x: Math.sign(this._profile.vel().x) * 2 }),
						dim: { x: 1, y: 1 },
						vel: this._profile.vel(),
						angle: Math.random() * 360,
					}
				});
			}
		}
	}
}