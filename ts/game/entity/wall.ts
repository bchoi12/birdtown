import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'

import { defined } from 'util/common'
import { Vec } from 'util/vector'

export class Wall extends EntityBase {

	private _attributes : Attributes;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WALL, entityOptions);

		this.setName({
			base: "wall",
			id: this.id(),
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.set(Attribute.SOLID, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				const pos = profile.pos();
				const dim = profile.dim();
				return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					isStatic: true,
				});
			},
			init: entityOptions.profileInit,
		}));

		/*
		this.addComponent(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				const dim = this._profile.dim();
				model.setMesh(BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: 16,
				}, game.scene()));
			},
		}));
		*/
	}
}