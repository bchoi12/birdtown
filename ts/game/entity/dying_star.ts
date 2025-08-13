import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { CollisionCategory, ColorType, MaterialType, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { SoundFactory } from 'game/factory/sound_factory'

import { Fns, InterpType } from 'util/fns'
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

export class DyingStar extends EntityBase {

	private _initPos : Optional<Vec2>;
	private _target : Optional<Vec2>;
	private _dir : Vec2;

	private _association : Association;
	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.DYING_STAR, entityOptions);

		this._initPos = Optional.empty(Vec2.zero());
		this._target = Optional.empty(Vec2.zero());
		this._dir = Vec2.zero();

		this.addProp<Vec>({
			has: () => { return this._initPos.has(); },
			export: () => { return this._initPos.get().toVec(); },
			import: (obj : Vec) => { this._initPos.set(Vec2.fromVec(obj)); },
		});
		this.addProp<Vec>({
			has: () => { return this._target.has(); },
			export: () => { return this._target.get().toVec(); },
			import: (obj : Vec) => { this._target.set(Vec2.fromVec(obj)); },
		});

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.initDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.neverCollideFilter(),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.BLACK).toString(),
		})
		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();
				let mesh = BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: dim.x,
				}, game.scene());

				for (let i = 0; i < 2; ++i) {
					let ring = BABYLON.MeshBuilder.CreateTorus(this.name() + "-ring-" + i, {
						diameter: dim.x * 1.8,
						thickness: dim.x / 10,
					}, game.scene());
					ring.rotation.x = 2 * Math.PI * Math.random();
					ring.rotation.y = 2 * Math.PI * Math.random();
					ring.rotation.z = 2 * Math.PI * Math.random();
					ring.material = MaterialFactory.material(MaterialType.DYING_STAR_RING);

					mesh.addChild(ring);
				}

				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				materialType: MaterialType.DYING_STAR,
				...entityOptions.modelInit,
			},
		}));
	}

	setTarget(target : Vec2) : void {
		this._target.set(target.clone());
	}

	override ready() : boolean {
		return super.ready() && this._target.has() && this._association.hasRefreshedOwner();
	}

	override initialize() : void {
		super.initialize();

		if (this.isSource()) {
			this._initPos.set(this.profile().pos().clone());
		}
		this._dir = this._target.get().clone().sub(this._initPos.get()).sign();

		this.setTTL(800);
		SoundFactory.playFromEntity(SoundType.CINEMATIC_WOOSH, this);
	}

	override delete() : void {
		super.delete();

		if (!this._target.has()) {
			return;
		}

		this.addEntity(EntityType.BLACK_HOLE, {
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: this._target.get(),
			},
		});
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		this._profile.setPos(this._initPos.get().interpolateClone(this._target.get(), this.ttlElapsed(), Fns.interpFns.get(InterpType.NEGATIVE_SQUARE)));

		this.model().scaling().setAll(2 + 0.5 * Math.sin(2 * Math.PI * this.ttlElapsed()));

		this.model().rotation().x += this._dir.x * 5 * millis / 1000;
		this.model().rotation().y += this._dir.y * 7 * millis / 1000;
		this.model().rotation().z += this._dir.x * 11 * millis / 1000;
	}
}