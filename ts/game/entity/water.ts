
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BoundBase } from 'game/entity/bound'
import { CollisionCategory, ColorType, MaterialType, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { SoundFactory } from 'game/factory/sound_factory'
import { StepData } from 'game/game_object'
import { TimeType } from 'game/system/api'

import { settings } from 'settings'

import { ui } from 'ui'

import { Fns } from 'util/fns'
import { Optional } from 'util/optional'

enum SubMesh {
	UNKNOWN,

	LEFT_WATER,
	RIGHT_WATER,
}

export class Water extends EntityBase implements Entity {

	private _splashEntities : Set<number>;
	private _wetEntities : Set<number>;
	private _dryEntities : Set<number>;
	private _frozen : Optional<boolean>;
	private _underwater : boolean;

	private _profile : Profile;
	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WATER, entityOptions);

		this._splashEntities = new Set();
		this._wetEntities = new Set();
		this._dryEntities = new Set();
		this._frozen = new Optional();

		if (this.isSource()) {
			this._frozen.set(game.world().isFreezing());
		}

		this._underwater = false;

		this.addProp<boolean>({
			has: () => { return this._frozen.has(); },
			import: (obj : boolean) => { this._frozen.set(obj); },
			export: () => { return this._frozen.get(); }
		})

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					isSensor: true,
					isStatic: true,
					collisionFilter: this._frozen.get() ? BodyFactory.neverCollideFilter() : BodyFactory.collisionFilter(CollisionCategory.INTERACTABLE),
				});
			},
			init: entityOptions.profileInit,
		}));

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready() },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();
				const height = dim.z;

				let mesh = BABYLON.MeshBuilder.CreatePlane(this.name(), {
					width: dim.x,
					height: 1,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE,
				}, game.scene());
				model.rotation().x = Math.PI / 2;
				model.translation().y = dim.y / 2;

				model.setAllowWrap(false);
				model.scaling().y = height;

				// Disable shadows for water on side
				let leftWater = BABYLON.MeshBuilder.CreatePlane(this.name(), {
					width: dim.x,
					height: 1,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE,
				}, game.scene());
				leftWater.position.x -= dim.x;
				leftWater.receiveShadows = false;
				leftWater.material = MaterialFactory.material(MaterialType.FROZEN_WATER);
				model.registerSubMesh(SubMesh.LEFT_WATER, leftWater);

				let rightWater = BABYLON.MeshBuilder.CreatePlane(this.name(), {
					width: dim.x,
					height: 1,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE,
				}, game.scene());
				rightWater.position.x += dim.x;
				rightWater.receiveShadows = false;
				rightWater.material = MaterialFactory.material(MaterialType.FROZEN_WATER);
				model.registerSubMesh(SubMesh.RIGHT_WATER, rightWater);

				model.setMesh(mesh);
			},
			init: {
				materialType: MaterialType.FROZEN_WATER,
				...entityOptions.modelInit,
			},
		}));
	}

	override ready() : boolean { return super.ready() && this._frozen.has(); }

	override initialize() : void {
		super.initialize();

		if (!this._frozen.get()) {
			return;
		}

		// Frozen over
		this.addEntity(EntityType.FLOOR, {
			profileInit: {
				pos: this._profile.pos(),
				dim: {
					x: 2 * this._profile.dim().x,
					y: this._profile.dim().y,
				},
			},
		});
	}

	override delete() : void {
		super.delete();

		this._wetEntities.forEach((id : number) => {
			const [entity, ok] = game.entities().getEntity(id);
			if (ok) {
				entity.setAttribute(AttributeType.UNDERWATER, false);
			}
		})
	}

	private splash(entity : Entity, splashIn : boolean) : void {

		if (!this.valid() || !entity.valid()) {
			return;
		}

		const waterLevel = this._profile.pos().y + this._profile.dim().y / 2;

		let weight;
		if (splashIn) {
			const yVel = entity.profile().vel().y;
			weight = 0.5 + 0.5 * Fns.clamp(0, (-yVel - 0.05) / 0.1, 1);
		} else {
			weight = 1;
		}

		for (let i = 0; i < 6; ++i) {
			let scale;
			if (splashIn) {
				scale = 0.3 + 0.3 * weight;
			} else {
				scale = 0.4 * weight + Fns.randomNoise(0.1);
			}

			this.addEntity(EntityType.WATER_PARTICLE, {
				offline: true,
				ttl: 500,
				profileInit: {
					pos: {
						x: entity.profile().pos().x + Fns.randomNoise(entity.profile().dim().x / 2),
						y: waterLevel,
					},
					vel: {
						x: Fns.randomNoise(0.15),
						y: Math.min(0.2, 0.5 * scale) + Math.random() * 0.1,
					},
					scaling: { x: scale, y: scale },
					gravity: true,
				},
				modelInit: {
					transforms: {
						translate: { z: Fns.randomNoise(0.1) },
					},
					materialType: MaterialType.FROZEN_WATER,
				}
			});
		}

		if (splashIn) {
			const soundPos = new BABYLON.Vector3(entity.profile().getRenderPos().x, waterLevel, 0);
			SoundFactory.playFromPos(SoundType.SPLASH_IN, soundPos, {
				volume: settings.soundVolume() * Math.min(0.7, weight),
			});
		} else {
			SoundFactory.playFromEntity(SoundType.SPLASH_OUT, entity, {
				volume: settings.soundVolume() * Math.min(0.7, weight),
			});
		}
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);

		if (this._frozen.get()) {
			return;
		}

		// Enter water
		this._splashEntities.forEach((id : number) => {
			const [entity, ok] = game.entities().getEntity(id);
			this._splashEntities.delete(id);

			if (!ok) {
				return;
			}

			entity.profile().scaleVel(0.3);
			entity.setAttribute(AttributeType.UNDERWATER, true);
			this.splash(entity, true);
			this._wetEntities.add(id);
		});

		// Exit water
		this._dryEntities.forEach((id : number) => {
			const [entity, ok] = game.entities().getEntity(id);
			this._wetEntities.delete(id);

			if (!ok) {
				return;
			}
			entity.setAttribute(AttributeType.UNDERWATER, false);

			if (entity.dead()) {
				return;
			}

			this.splash(entity, false);
			if (entity.profile().vel().y > 0) {
				entity.profile().vel().y *= 2;
			}
		});
	}

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		this._splashEntities.clear();
		this._dryEntities = new Set(this._wetEntities);
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this._frozen.get()) {
			return;
		}

		if (this._profile.bufferContains(other.profile().pos(), { x: 0.3, y: 0.3 })) {
			if (!this._wetEntities.has(other.id())) {
				this._splashEntities.add(other.id());
			}
			this._dryEntities.delete(other.id())
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		if (this._frozen.get() || !this._model.hasMesh() || !game.lakitu().validTargetEntity()) {
			return;
		}

		const underwater = game.lakitu().targetEntity().getAttribute(AttributeType.UNDERWATER);
		if (this._underwater !== underwater) {
			this._underwater = underwater;

			if (this._underwater) {
				this._model.scaling().y = 16;
			} else {
				this._model.scaling().y = this._profile.dim().z;
			}
		}
	}
}