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

		this.addComponent(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				loader.load(ModelType.ARCH_BASE, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.name = this.name();

					console.log(result);
					console.log(mesh);
					console.log(mesh.subMeshes);

					let mat = new BABYLON.StandardMaterial("asdf", game.scene());
					mat.diffuseColor = new BABYLON.Color3(0, 0, 1);
					result.meshes[5].material = mat;
					console.log(result.meshes[5].material);

					model.setMesh(mesh);
				});
			},
		}));
	}
}