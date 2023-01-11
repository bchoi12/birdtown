import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'

import { defined } from 'util/common'
import { Vec } from 'util/vector'

export class Wall extends EntityBase {

	private _profile : Profile;

	constructor(options : EntityOptions) {
		super(EntityType.WALL, options);

		this.setName({
			base: "wall",
			id: this.id(),
		});

		this.attributes().set(Attribute.SOLID, true);

		this._profile = <Profile>this.add(new Profile({
			initFn: (profile : Profile) => {
				const pos = profile.pos();
				const dim = profile.dim();
				profile.set(MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					isStatic: true,
				}));
			},
			init: options.profileInit,
		}));

		this.add(new Model({
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
	}
}