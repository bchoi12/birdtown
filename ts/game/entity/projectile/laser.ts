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
import { CollisionCategory, ColorType, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { SoundFactory } from 'game/factory/sound_factory'

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec, Vec2 } from 'util/vector'

export class Laser extends Projectile {

	private static readonly _ttl = 750;
	private static readonly _activateTiming = 0.15;
	private static readonly _damageTiming = 0.55;
	private static readonly _fadeTiming = 0.7;
	private static readonly _initialScale = 0.1;

	private _active : boolean;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.LASER, entityOptions);

		this._active = false;

		this.setTTL(Laser._ttl);
		this.setSnapOnHit(false);
		this.setPlayImpactSound(false);

		this.setAttribute(AttributeType.PHASING, true);

		this._profile = this.addComponent<Profile>(new Profile({
			readyFn: () => { return this._profile.hasAngle(); },
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.SHOOTER_ORANGE).toString(),
		})

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();

				let mesh = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x - 0.05,
					height: 0.7 * dim.y,
					depth: 0.15,
				}, game.scene());
				mesh.material = MaterialFactory.material(MaterialType.SHOOTER_WHITE);

				let outline = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: 0.1,
				}, game.scene());
				outline.material = MaterialFactory.material(MaterialType.SHOOTER_ORANGE);

				mesh.addChild(outline);

				game.world().glow(outline, {
					intensity: 0.4,
				});

				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				...entityOptions.modelInit,
			},
		}));
	}

	override initialize() : void {
		super.initialize();

		if (this.isSource()) {
			const dim = this._profile.dim();
			const angle = this._profile.angle();
			this._profile.pos().add({
				x: 0.5 * Math.cos(angle) * dim.x,
				y: 0.5 * Math.sin(angle) * dim.x,
			});
		}

		this._model.scaling().y = Laser._initialScale;
		SoundFactory.playFromPos(SoundType.LASER, this._profile.pos().toBabylon3(), {
			playbackRate: game.runner().updateSpeed(),
		});
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const vel = this._profile.vel();
		if (!vel.isZero()) {
			this._profile.setAngle(vel.angleRad());
		}

		const ttlElapsed = this.ttlElapsed();
		if (ttlElapsed >= Laser._damageTiming) {
			if (ttlElapsed >= Laser._fadeTiming) {
				this._active = false;
			} else {
				this._active = true;
			}
			const weight = (ttlElapsed - Laser._damageTiming) / (1 - Laser._damageTiming);
			this._model.scaling().y = 1 - weight;
		} else if (ttlElapsed >= Laser._activateTiming) {
			const weight = 0.3 * (ttlElapsed - Laser._activateTiming) / (Laser._damageTiming - Laser._activateTiming);
			this._model.scaling().y = Laser._initialScale + (1 - Laser._initialScale) * weight;
		}
	}

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		// Hack to enable collision across level seam
		if (game.level().isCircle()) {
			const tickNum = game.runner().tickNum();
			if (tickNum % 3 === 1) {
				this._profile.forcePos({
					x: this._profile.pos().x + game.level().bounds().width(),
					y: this._profile.pos().y,
				});
			} else if (tickNum % 3 === 2) {
				this._profile.forcePos({
					x: this._profile.pos().x - game.level().bounds().width(),
					y: this._profile.pos().y,
				});
			}
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		// Undo the hack
		if (game.level().isCircle()) {
			const tickNum = game.runner().tickNum();
			if (tickNum % 3 === 1) {
				this._profile.forcePos({
					x: this._profile.pos().x - game.level().bounds().width(),
					y: this._profile.pos().y,
				});
			} else if (tickNum % 3 === 2) {
				this._profile.forcePos({
					x: this._profile.pos().x + game.level().bounds().width(),
					y: this._profile.pos().y,
				});
			}
		}
	}

	protected override canHit(collision : MATTER.Collision, other : Entity) : boolean {
		return this._active && super.canHit(collision, other);
	}

	override onMiss() : void {}
}