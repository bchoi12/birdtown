
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { CollisionCategory, ColorType, DepthType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { GameGlobals } from 'global/game_globals'

import { CardinalDir } from 'util/cardinal'


export class Pergola extends EntityBase implements Entity {

	private _attributes : Attributes;
	private _model : Model;
	private _profile : Profile;
	private _subProfile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PERGOLA, entityOptions);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this.setAttribute(AttributeType.SOLID, true);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.PERGOLA, (result : LoadResult) => {
					model.setMesh(<BABYLON.Mesh>result.meshes[0]);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					density: 0.2 * BodyFactory.defaultDensity,
					friction: 1.5 * BodyFactory.defaultFriction,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.OFFSET),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.LEVEL_WHITE).toString(),
			depthType: DepthType.BACKGROUND,
		});

		this._subProfile = this._profile.addSubComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				let topDim = { x: profile.unscaledDim().x, y: 0.5 };
				return BodyFactory.rectangle(this._profile.relativePos(CardinalDir.TOP, topDim), topDim, {
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.SOLID),
				});
			},
			init: entityOptions.profileInit,
			prePhysicsFn: (profile : Profile) => {
				profile.setAngle(this._profile.angle());
			},
			postPhysicsFn: (profile : Profile) => {
				profile.setAngle(this._profile.angle());
			},
		}));
		this._subProfile.setInertia(Infinity);
		this._subProfile.setMinimapOptions({
			color: ColorFactory.color(ColorType.LEVEL_BROWN).toString(),
			depthType: DepthType.FLOOR,
		});
		this._subProfile.onBody((subProfile : Profile) => {
			this._profile.onBody((profile : Profile) => {
				profile.setAngle(0);
				subProfile.attachTo(profile, { x: 0, y: 1.75 });

				profile.stop();
				subProfile.stop();
				profile.setAcc({ y: GameGlobals.gravity });
			});
		});
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this._profile.pos().y < game.level().bounds().min.y) {
			this.delete();
		}
	}
}