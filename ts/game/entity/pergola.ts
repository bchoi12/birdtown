
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
import { CollisionCategory, ColorType, DepthType, MeshType, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { GameGlobals } from 'global/game_globals'

import { CardinalDir } from 'util/cardinal'


export class Pergola extends EntityBase implements Entity {

	private static readonly _maxSpeed = 1;
	private static readonly _minSpeed = 1e-2;

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
					model.setMesh(result.mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					density: 0.2 * BodyFactory.defaultDensity,
					friction: 1.5 * BodyFactory.defaultFriction,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.PERGOLA_FRAME),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setLimitFn((profile : Profile) => {
			profile.capSpeed(Pergola._maxSpeed);
			if (Math.abs(profile.vel().x) < Pergola._minSpeed) {
				profile.vel().x = 0;
			}
		});
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

	override impactSound() : SoundType { return SoundType.WOOD_THUD; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (game.controller().inSetup()) {
			this._profile.vel().scale(0);
			this._subProfile.vel().scale(0);
		}

		if (this._profile.pos().y < game.level().bounds().min.y) {
			this.delete();
		}
	}
}