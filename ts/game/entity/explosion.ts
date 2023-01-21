import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { BodyCreator } from 'game/util/body_creator'

import { Vec, Vec2 } from 'util/vector'

export class Explosion extends EntityBase {

	private _profile : Profile;

	private _hit : Set<number>;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.EXPLOSION, entityOptions);

		this.setName({
			base: "explosion",
			id: this.id(),
		});

		this._hit = new Set();

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyCreator.circle(profile.pos(), profile.dim(), {
					isStatic: true,
					isSensor: true,
				});
			},
			init: entityOptions.profileInit,
		}));

		this.addComponent(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				const dim = this._profile.dim();
				model.setMesh(BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: dim.x,
				}, game.scene()));
			},
		}));
	}

	override collide(other : Entity, collision : MATTER.Collision) : void {
		super.collide(other, collision);

		if (this._hit.has(other.id())) {
			return;
		}

		if (!other.hasComponent(ComponentType.ATTRIBUTES) || !other.hasComponent(ComponentType.PROFILE)) {
			return;
		}

		const otherAttributes = other.getComponent<Attributes>(ComponentType.ATTRIBUTES);
		if (!otherAttributes.getOrDefault(Attribute.SOLID)) {
			return;
		}

		const otherProfile = <Profile>other.getComponent(ComponentType.PROFILE);
		let force = otherProfile.pos().clone().sub(this._profile.pos()).normalize().scale(0.48);
		otherProfile.addForce(force);

		this._hit.add(other.id());
	}

}