import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { GameConstants } from 'game/core'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { BodyCreator } from 'game/util/body_creator'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

export class Crate extends EntityBase {

	private _attributes : Attributes;
	private _profile : Profile;

	private _startingPos : Vec2;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CRATE, entityOptions);

		this.setName({
			base: "crate",
			id: this.id(),
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.set(Attribute.SOLID, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyCreator.rectangle(profile.pos(), profile.dim(), {
					density: BodyCreator.heavyDensity,
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setAcc({ y: GameConstants.gravity });
		this._profile.setAngle(0);

		this.addComponent(new Model({
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
	}

	override update(millis : number) : void {
		super.update(millis);

		if (this._profile.pos().y < -10) {
			this._profile.setPos(this._startingPos);
			this._profile.stop();

			this._profile.setAcc({ y: GameConstants.gravity });
			this._profile.setAngle(0);
		}
	}
}