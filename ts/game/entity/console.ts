import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

import { ui } from 'ui'
import { TooltipType, TooltipMsg } from 'ui/api'

export class Console extends EntityBase {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CONSOLE, entityOptions);

		this.setName({
			base: "console",
			id: this.id(),
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				const dim = this._profile.dim();
				model.setMesh(BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: 0.5,
				}, game.scene()));
				model.mesh().position.z = -1;
			},
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.dim(), {
					isStatic: true,
					isSensor: true,
				});
			},
			init: entityOptions.profileInit,
		}));
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (other.type() !== EntityType.PLAYER) {
			return;
		}

		if (!other.clientIdMatches()) {
			return;
		}

		ui.showTooltip({
			type: TooltipType.TEST,
			ttl: 3000,
		});
	}
}