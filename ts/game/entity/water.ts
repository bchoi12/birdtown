
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BoundBase } from 'game/entity/bound'
import { CollisionCategory, ColorType, MaterialType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'

import { ui } from 'ui'

export class Water extends EntityBase implements Entity {

	private _underwater : boolean;

	private _profile : Profile;
	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WATER, entityOptions);

		this._underwater = false;

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					isSensor: true,
					isStatic: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.INTERACTABLE),
				});
			},
			init: entityOptions.profileInit,
		}));

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready() },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();
				let mesh = BABYLON.MeshBuilder.CreatePlane(this.name(), {
					width: dim.x,
					height: 1,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE,
				}, game.scene());
				let mat = new BABYLON.StandardMaterial(this.name(), game.scene());
				mat.diffuseColor = ColorFactory.color(ColorType.WATER).toBabylonColor3();
				mesh.material = mat;

				model.rotation().x = Math.PI / 2;
				model.translation().y = dim.y / 2;

				model.scaling().x = 2;
				model.scaling().y = dim.z;

				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				...entityOptions.modelInit,
			},
		}));
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this._profile.bufferContains(other.profile().pos(), { x: 0.3, y: 0.3 })) {
			other.setAttribute(AttributeType.UNDERWATER, true);
			other.profile().scaleVel(0.3);
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		if (!this._model.hasMesh() || !game.lakitu().validTargetEntity()) {
			return;
		}

		const underwater = game.lakitu().targetEntity().getAttribute(AttributeType.UNDERWATER);
		if (this._underwater !== underwater) {
			this._underwater = underwater;

			if (this._underwater) {
				this._model.mesh().material.alpha = 0.8;
				this._model.scaling().y = 12;
			} else {
				this._model.mesh().material.alpha = 1;
				this._model.scaling().y = this._profile.initDim().z;
			}
		}
	}
}