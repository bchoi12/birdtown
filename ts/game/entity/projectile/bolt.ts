import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Projectile } from 'game/entity/projectile'
import { MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

export class Bolt extends Projectile {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOLT, entityOptions);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
				});
			},
			init: entityOptions.profileInit,
		}));

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				const dim = this._profile.unscaledDim();
				model.setMesh(BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: (dim.x + dim.y) / 2,
				}, game.scene()));
			},
			init: entityOptions.modelInit,
		}));
	}

	override damage() : number { return this.getAttribute(AttributeType.CHARGED) ? 70 : 12; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		const vel = this._profile.vel();
		if (!vel.isZero()) {
			this._profile.setAngle(vel.angleRad());
		}
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (!this.isSource()) {
			return;
		}

		if (this.matchAssociations([AssociationType.OWNER], other)) {
			return;
		}

		// TODO: collide with multiple objects?
		if (other.getAttribute(AttributeType.SOLID)) {
			other.takeDamage(this.damage(), this);

			if (this.getAttribute(AttributeType.CHARGED)) {
				this.explode();
			}

			this.delete();
		}
	}
}