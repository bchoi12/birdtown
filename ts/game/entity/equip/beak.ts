import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { TextParticle } from 'game/entity/particle/text_particle'
import { BuffType, ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Timer} from 'util/timer'
import { Vec2, Vec3 } from 'util/vector'

enum Animation {
	IDLE = "Idle",
	SQUAWK = "Squawk",
}

export abstract class Beak extends Equip<Player> {

	private static readonly _animations = new Set<string>([Animation.IDLE, Animation.SQUAWK]);

	private _squawking : boolean;

	private _model : Model;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BEAK);

		this._squawking = false;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(this.meshType(), (result : LoadResult) => {
					let mesh = result.mesh;

					result.animationGroups.forEach((animationGroup : BABYLON.AnimationGroup) => {
						if (Beak._animations.has(animationGroup.name)) {
							model.registerAnimation(animationGroup, /*group=*/0);
						}
					});
					model.stopAllAnimations();

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(this.soundType());
	}

	abstract meshType() : MeshType;
	abstract soundType() : SoundType;

	override attachType() : AttachType { return AttachType.BEAK; }

	override charged() : boolean { return this.hasOwner() && (this.owner().hasMaxedBuff(BuffType.SQUAWK_SHOT) || this.owner().hasMaxedBuff(BuffType.SQUAWK_SHIELD)); }

	override takeDamage(amount : number, from? : Entity, hitEntity? : Entity) : void {
		super.takeDamage(amount, from, hitEntity);

		if (!this.isSource() || !this.hasOwner() || this.owner().dead()) {
			return;
		}

		if (Math.random() * amount >= 8 + 0.22 * Math.random() * this.owner().maxHealth()) {
			this.setSquawking(true);
		}
	}

	protected override hudType() : HudType { return HudType.SQUAWK; }
	protected override useKeyType() : KeyType { return KeyType.SQUAWK; }

	private hasSquawkBuff() : boolean { return this.hasOwner() && (this.owner().hasBuff(BuffType.SQUAWK_SHOT) || this.owner().hasBuff(BuffType.SQUAWK_SHIELD)); }
	protected override getBaseChargeRate() : number {
		if (this.hasSquawkBuff()) {
			return 100;
		}
		return super.getBaseChargeRate();
	}
	protected override getBaseUseJuice() : number {
		if (this.hasSquawkBuff()) {
			return 100;
		}
		return super.getBaseUseJuice();
	}
	protected override getChargeDelay() : number {
		if (this.hasSquawkBuff()) {
			return 600;
		}
		return super.getChargeDelay();
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this.key(this.useKeyType(), KeyState.DOWN)) {
			this.setSquawking(true);
		}
	}

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		if (!this.initialized()) {
			return;
		}

		this._squawking = true;
		this.soundPlayer().onEnded(this.soundType()).addOnce(() => {
			this._squawking = false;
		});
		this.soundPlayer().playFromEntity(this.soundType(), this.owner());

		const modelPos = this.model().root().getAbsolutePosition();
		const [particle, hasParticle] = this.addEntity<TextParticle>(EntityType.TEXT_PARTICLE, {
			offline: true,
			ttl: 1200,
			profileInit: {
				pos: Vec3.fromBabylon3(modelPos).add({ z: 0.3 }),
				vel: Vec2.unitFromRad(this.owner().headAngle()).scale(0.03),
				acc: { x: 0, y: 0.03 },
			},
		});
		if (hasParticle) {
			particle.setText({
				text: "🎵",
				height: 0.7,
			});
		}

		if (this.owner().hasBuff(BuffType.SQUAWK_SHOT)) {
			const unitDir = this.getDir();
			if (this.charged()) {
				this.addEntity(EntityType.LASER, this.getProjectileOptions(this.owner().profile().pos(), unitDir, unitDir.angleRad()));
			} else {
				this.addEntity(EntityType.ROCKET, this.getProjectileOptions(Vec3.fromBabylon3(modelPos), unitDir));			
			}
		} /*else if (this.owner().hasBuff(BuffType.SQUAWK_SHIELD)) {
			if (this.charged()) {

			} else {

			}
		}*/

		this.addEntity(EntityType.SQUAWK_SHIELD, {
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: this.owner().profile().pos(),
			},
		})
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) { return; }

		if (this._squawking && !this.canCharge() || this.owner()?.dead()) {
			this._model.playAnimation(Animation.SQUAWK);
		} else {
			this._squawking = false;
			this._model.playAnimation(Animation.IDLE);
		}
	}

	private setSquawking(squawking : boolean) : void {
		if (this._squawking === squawking) {
			return;
		}

		if (this.canUse() && squawking) {
			this.recordUse();
		}
	}
}