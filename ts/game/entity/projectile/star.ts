import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'
import earcut from 'earcut'

import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { Projectile } from 'game/entity/projectile'
import { CollisionCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { StepData } from 'game/game_object'

import { GameGlobals } from 'global/game_globals'

import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

export class Star extends Projectile {

	private static readonly _damage = 15;

	private static readonly _trailVertices = [
        new BABYLON.Vector3(0, 0, 0.1),
        new BABYLON.Vector3(-0.8, 0, 0),
        new BABYLON.Vector3(0, 0, -0.1),
	];

	private _spinning : boolean;
	private _trail : Optional<BABYLON.Mesh>;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.STAR, entityOptions);

		this._spinning = true;
		this._trail = new Optional();

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setAcc({ y: GameGlobals.gravity });
		this._profile.setOutOfBoundsFn((profile : Profile) => {
			this.delete();
		});
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.EASTERN_PURPLE).toString(),
		})

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.STAR, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.rotation.y = Math.PI / 2;
					model.setMesh(mesh);

					const dim = EntityFactory.getStaticDimension(this.type());
					let trail = BABYLON.MeshBuilder.ExtrudePolygon(this.name() + "-trail", {
						shape: Star._trailVertices,
						depth: 0.1,
					}, game.scene(), earcut);
					trail.rotation.x = Math.PI / 2;
					trail.material = MaterialFactory.material(MaterialType.EASTERN_PURPLE_SOLID_TRAIL);
					trail.isVisible = false;
					trail.parent = model.root();

					this._trail.set(trail);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override hitDamage() : number { return 0; }

	override initialize() : void {
		super.initialize();

		this._model.onLoad((model : Model) => {
			model.mesh().rotation.x = Math.random() * 2 * Math.PI;
		});
	}

	stick(entity : Entity) : boolean {
		if (this._profile.attached()) {
			return false;
		}
		if (!entity.hasProfile()) {
			return false;
		}

		const offset = this._profile.pos().clone().sub(entity.profile().pos());
		return this._profile.attachTo(entity.profile(), offset);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._profile.attached()) {
			this._spinning = false;

			const [parent, hasParent] = this._profile.attachEntity();
			if (hasParent) {
				if (parent.getAttribute(AttributeType.INVINCIBLE)) {
					this.delete();
				}
			}
		} else {
			this._profile.setAcc({ y: GameGlobals.gravity });
		}

		if (this._spinning) {
			this._model.mesh().rotation.x += Math.sign(this._profile.vel().x) * 6 * Math.PI * millis / 1000;
		}
		if (this._trail.has()) {
			this._trail.get().isVisible = this._spinning;
			this._trail.get().scaling.x = Math.min(10 * this._profile.vel().lengthSq(), 1);
		}
		this._model.rotation().z = this._profile.vel().angleRad();
	}

	override canHit(collision : MATTER.Collision, other : Entity) : boolean {
		return !this._profile.attached() && super.canHit(collision, other);
	}
	override onHit() : void {
		for (const id of this.hits()) {
			const [entity, ok] = game.entities().getEntity(id);
			if (ok && this.stick(entity)) {
				break;
			}
		}
	}

	override onMiss() : void {
		const dim = EntityFactory.getStaticDimension(this.type());
		this.explode(EntityType.STAR_EXPLOSION, {});
	}

	override onExpire() : void {
		super.onExpire();

		if (this._profile.attached()) {
			const [parent, ok] = game.entities().getEntity(this._profile.attachId());
			if (ok) {
				parent.takeDamage(Star._damage, this);
			}
		}
	}
}