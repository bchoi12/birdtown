import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'
import { SoundType } from 'game/system/api'

import { Vec, Vec2 } from 'util/vector'

export class Explosion extends EntityBase implements Entity {

	private _profile : Profile;

	private _hit : Set<number>;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.EXPLOSION, entityOptions);

		this.addNameParams({
			base: "explosion",
			id: this.id(),
		});

		this._hit = new Set();

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.dim(), {
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

	override initialize() : void {
		super.initialize();

		game.audio().loadSound(SoundType.EXPLOSION, (sound : BABYLON.Sound) => {
			sound.setPosition(this._profile.pos().toBabylon3());
			sound.play();
		});
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this._hit.has(other.id())) {
			return;
		}

		if (!other.getAttribute(AttributeType.SOLID)) {
			return;
		}

		const otherProfile = other.getProfile();
		let force = otherProfile.pos().clone().sub(this._profile.pos()).normalize();
		otherProfile.addForce(force);

		this._hit.add(other.id());
	}

}