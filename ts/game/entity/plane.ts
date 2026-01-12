import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Bird } from 'game/entity/bird'
import { ColorType, DepthType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { globalRandom } from 'util/seeded_random'
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
	private _crateList : Array<EntityType>;
	private _crateIndex : number;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLANE, entityOptions);

		this._crateSpawner = new RateLimiter(Plane._crateSpawnInterval);

		this._crateList = new Array(
			EntityType.HEALTH_CRATE,
			EntityType.HEALTH_CRATE,
			EntityType.HEALTH_CRATE,
			EntityType.WEAPON_CRATE,
			EntityType.WEAPON_CRATE,
			EntityType.BUFF_CRATE,
		);
		this._crateIndex = 0;

		globalRandom.shuffle(this._crateList);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.PLANE, (result : LoadResult) => {
					let mesh = result.mesh;

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
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					isSensor: true,
					friction: 0,
					frictionAir: 0,
					collisionFilter: BodyFactory.neverCollideFilter(),
				});
			},
			init: entityOptions.profileInit,
		}));

		const vel = this.xVel();
		this._profile.setVel({x: vel, y: 0});

		// Set rotation in right direction
		if (vel > 0) {
			this._model.rotation().y = 0;
		} else {
			this._model.rotation().y = -Math.PI;
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		// Turn around
		if (!game.level().isCircle()) {
			const bounds = game.level().bounds();
			const side = bounds.xSide(this._profile.pos(), /*buffer=*/-0.5 * this._profile.dim().x);
			if (side !== 0) {
				this._profile.setVel({ x: -1 * side * Plane._speed });
			}
		}

		// Rotate to match velocity direction
		let rotation = this._model.rotation();
		if (this._profile.vel().x > 0) {
			rotation.y = Math.min(0, rotation.y + Plane._turnRate * millis / 1000);
		} else {
			rotation.y = Math.max(-Math.PI, rotation.y - Plane._turnRate * millis / 1000);
		}

		if (this.isSource() && this._crateSpawner.check(millis)) {
			this.maybeDropCrate();
			this._crateSpawner.setLimit(Plane._crateSpawnInterval + 0.5 * Math.random() * Plane._crateSpawnInterval);
		}
	}

	private xVel() : number {
		return (game.controller().round() % 2 === 0 ? -1 : 1) * Plane._speed;
	}

	private maybeDropCrate() : void {
		let crateType = this._crateList[this._crateIndex % this._crateList.length];

		const numCrates = game.entities().getMap(crateType).numEntities();

		if (numCrates < game.controller().entityLimit(crateType)) {
			this.addEntity(crateType, {
				profileInit: {
					pos: this._profile.pos().clone().add({ x: Math.sign(this._profile.vel().x) * 2 }),
					vel: this._profile.vel(),
					angle: Math.random() * 360,
				}
			});
		}

		this._crateIndex++;

		if (this._crateIndex >= this._crateList.length) {
			globalRandom.shuffle(this._crateList);
			this._crateIndex = 0;
		}
	}
}