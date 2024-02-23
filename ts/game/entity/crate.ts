import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { GameGlobals } from 'global/game_globals'

import { Box2 } from 'util/box'
import { defined } from 'util/common'
import { Vec, Vec2, Vec3 } from 'util/vector'

export class Crate extends EntityBase implements Entity {

	private _attributes : Attributes;
	private _profile : Profile;
	private _model : Model;

	private _startingPos : Vec2;
	private _startingAngle : number;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CRATE, entityOptions);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					density: BodyFactory.defaultDensity,
					render: {
						fillStyle: "#FF0000",
					}
				});
			},
			init: {...entityOptions.profileInit, degraded: true },
		}));
		this._profile.setAcc({ y: GameGlobals.gravity });
		if (!this._profile.hasAngle()) {
			this._profile.setAngle(0);
		}
		this._profile.setRenderUnoccluded();
		this._profile.mergeLimits({
			// TODO: scalar param?
			maxSpeed: {x: 0.6, y: 0.6 },
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.CRATE, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					const modelDimension = EntityFactory.getDimension(this.type());
					let scaling = {
						x: this._profile.scaledDim().x / modelDimension.x,
						y: this._profile.scaledDim().y / modelDimension.y,
					}
					mesh.scaling.set(scaling.x, scaling.y, (scaling.x + scaling.y) / 2);
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override initialize() : void {
		super.initialize();

		this._startingPos = this._profile.pos().clone();
		this._startingAngle = this._profile.angle();
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this._profile.pos().y < -10) {
			this._profile.setPos(this._startingPos);
			this._profile.stop();
			this._profile.setAcc({ y: GameGlobals.gravity });
			this._profile.setAngle(this._startingAngle);
		}

		if (!this._model.hasMesh()) {
			return;
		}

		if (this.getAttribute(AttributeType.BRAINED)) {
			game.world().highlight(this._model.mesh(), {
				enabled: true,
				color: BABYLON.Color3.Blue(),
			});
		} else {
			game.world().highlight(this._model.mesh(), {
				enabled: false
			});
		}
	}
}