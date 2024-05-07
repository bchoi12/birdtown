import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { SoundPlayer } from 'game/component/sound_player'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { CollisionCategory, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MaterialFactory } from 'game/factory/material_factory'

import { Vec, Vec2 } from 'util/vector'

export class Explosion extends EntityBase implements Entity {

	private _profile : Profile;
	private _model : Model;
	private _soundPlayer : SoundPlayer;

	private _hit : Set<number>;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.EXPLOSION, entityOptions);

		this._hit = new Set();

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.unscaledDim(), {
					isStatic: true,
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: entityOptions.profileInit,
		}));

		this._model = this.addComponent<Model>(new Model({
			readyFn: (model: Model) => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				model.setMesh(BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: this._profile.unscaledDim().x,
				}, game.scene()));
			},
			init: {
				disableShadows: true, 
				...entityOptions.modelInit,
			},
		}));

		this._soundPlayer = this.addComponent<SoundPlayer>(new SoundPlayer());
		this._soundPlayer.registerSound(SoundType.EXPLOSION, SoundType.EXPLOSION);

		this._model.onLoad((model: Model) => {
			this._profile.onBody((profile : Profile) => {
				if (!this._model.hasMaterialType()) {
					return;
				}
				const material = MaterialFactory.material<BABYLON.StandardMaterial>(this._model.materialType());
				profile.body().render.fillStyle = material.emissiveColor.toHexString();
				profile.body().render.strokeStyle = material.emissiveColor.toHexString();
			});
		});
	}

	override initialize() : void {
		super.initialize();

		this._soundPlayer.playFromSelf(SoundType.EXPLOSION);
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this._hit.has(other.id())) {
			return;
		}

		if (!other.getAttribute(AttributeType.SOLID)) {
			return;
		}

		const otherProfile = other.profile();
		let force = otherProfile.pos().clone().sub(this._profile.pos()).normalize();
		otherProfile.addForce(force);

		this._hit.add(other.id());
	}

}