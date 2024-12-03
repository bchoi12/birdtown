import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Timer} from 'util/timer'

enum Animation {
	IDLE = "Idle",
	SQUAWK = "Squawk",
}

export abstract class Beak extends Equip<Player> {

	private static readonly _animations = new Set<string>([Animation.IDLE, Animation.SQUAWK]);
	private static readonly _squawkCooldown = 3000;

	private _squawking : boolean;
	private _squawkTimer : Timer;

	private _model : Model;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BEAK);

		this._squawking = false;
		this._squawkTimer = this.newTimer({
			canInterrupt: false,
		});

		this.addProp<boolean>({
			export: () => { return this._squawking; },
			import: (obj : boolean) => { this.setSquawking(obj); },
			options: {
				filters: GameData.udpFilters,
			},
		});

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
	squawkCooldown() : number { return Beak._squawkCooldown; }

	override attachType() : AttachType { return AttachType.BEAK; }

	override takeDamage(amount : number, from : Entity) : void {
		super.takeDamage(amount, from);

		if (!this.isSource() || this.owner().dead()) {
			return;
		}

		if (amount >= 8 + 32 * Math.random()) {
			this.setSquawking(true);
		}
	}

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();
		hudData.set(HudType.SQUAWK, {
			charging: !this.canUse(),
			empty: true,
			percentGone: this._squawkTimer.hasTimeLeft() ? (1 - this._squawkTimer.percentElapsed()) : 0,
			color: this.clientColorOr(ColorFactory.color(ColorType.WHITE).toString()),
			keyType: KeyType.SQUAWK,
		});
		return hudData;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		this.setCanUse(!this._squawkTimer.hasTimeLeft());
		this.setSquawking(this.key(KeyType.SQUAWK, KeyState.DOWN));
	}

	protected override simulateUse(uses : number) : void {
		this.soundPlayer().onEnded(this.soundType()).addOnce(() => {
			this._squawking = false;
		});
		this.soundPlayer().playFromEntity(this.soundType(), this.owner());
		this._squawkTimer.start(this.squawkCooldown());
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) { return; }

		if (this._squawking && this._squawkTimer.hasTimeLeft() || this.owner().dead()) {
			this._model.playAnimation(Animation.SQUAWK);
		} else {
			this._model.playAnimation(Animation.IDLE);
		}
	}

	private setSquawking(squawking : boolean) : void {
		if (this._squawking === squawking) {
			return;
		}
		if (!this.canUse()) {
			return;
		}
		this._squawking = squawking;

		if (this._squawking) {
			this.recordUse();
		}
	}
}