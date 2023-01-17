import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { loader, LoadResult, ModelType } from 'game/loader'

import { defined } from 'util/common'
import { Vec } from 'util/vector'

export class Building extends EntityBase {

	private _attributes : Attributes;
	private _profile : Profile;
	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BUILDING, entityOptions);

		this.setName({
			base: "building",
			id: this.id(),
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.set(Attribute.SOLID, true);

		const collisionGroup = MATTER.Body.nextGroup(true);
		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				const pos = profile.pos();
				const dim = profile.dim();
				return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					isSensor: true,
					isStatic: true,
					collisionFilter: {
						group: collisionGroup,
					},
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setDim({x: 12, y: 6});

		this._profile.addSubProfile(this.numChildren() + 1, new Profile({
			readyFn: (wall : Profile) => { return this._profile.initialized(); },
			bodyFn: (wall : Profile) => {
				let pos = this._profile.pos().clone();
				pos.sub({x: this._profile.dim().x / 2});
				const dim = wall.dim();

				console.log(this._profile.pos(), pos);

				return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					isStatic: true,
					collisionFilter: {
						group: collisionGroup,
					},
				});
			},
			init: {
				pos: {x: 0, y: 0},
				dim: {x: 0.5, y: this._profile.dim().y },
			},
		}));

		this.addComponent(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				loader.load(ModelType.ARCH_BASE, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.name = this.name();

					console.log(mesh);

					model.setMesh(mesh);
				});
			},
		}));
	}
}