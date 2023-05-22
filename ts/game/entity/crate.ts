import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameConstants } from 'game/api'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'
import { LayerType } from 'game/system/api'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

export class Crate extends EntityBase {

	private _attributes : Attributes;
	private _profile : Profile;
	private _model : Model;

	private _startingPos : Vec2;
	private _startingAngle : number;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CRATE, entityOptions);

		this.setName({
			base: "crate",
			id: this.id(),
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);
		this._attributes.setAttribute(AttributeType.PICKABLE, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.dim(), {
					density: BodyFactory.heavyDensity,
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setAcc({ y: GameConstants.gravity });
		if (!this._profile.hasAngle()) {
			this._profile.setAngle(0);
		}

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				const dim = this._profile.dim();
				model.setMesh(BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: (dim.x + dim.y) / 2,
				}, game.scene()));
			},
		}));
	}

	override initialize() : void {
		super.initialize();

		this._startingPos = this._profile.pos().clone();
		this._startingAngle = this._profile.angle();
	}

	override update(millis : number) : void {
		super.update(millis);

		if (this._profile.pos().y < -10) {
			this._profile.setPos(this._startingPos);
			this._profile.stop();
			this._profile.setAcc({ y: GameConstants.gravity });
			this._profile.setAngle(this._startingAngle);
		}
	}

	override preRender(millis : number) : void {
		super.preRender(millis);

		if (this._attributes.getAttribute(AttributeType.PICKED)) {
			game.world().getLayer<BABYLON.HighlightLayer>(LayerType.HIGHLIGHT).addMesh(this._model.mesh(), BABYLON.Color3.Red());
		}
	}
}