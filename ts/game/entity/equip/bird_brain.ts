
import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { LayerType } from 'game/system/api'

import { defined } from 'util/common'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export class BirdBrain extends Equip {

	private _target : Entity;
	private _constraint : MATTER.Constraint;
	private _constraintId : number;
	private _usageTimer : Timer;
	private _canCharge : boolean;
	private _player : Player;

	constructor(options : EntityOptions) {
		super(EntityType.BIRD_BRAIN, options);

		this._target = null;
		this._constraint = null;
		this._constraintId = 0;
		this._usageTimer = this.newTimer();
		this._canCharge = false;
		this._player = null;
	}

	override initialize() : void {
		super.initialize();

		let has;
		[this._player, has] = game.entities().getEntity<Player>(this._owner);

		if (!has) {
			console.error("Error: owner (%d) of %s is not a player!", this._owner, this.name());
		}
	}

	override use(dir : Vec2) : boolean {
		if (this._juice <= 0) {
			this.resetTarget();
			return;
		}

		if (defined(this._target)) {
			const mouse = game.keys(this._player.clientId()).mouse();
			const dist = 2 + (Math.abs(mouse.x - this._constraint.pointA.x) + Math.abs(mouse.y - this._constraint.pointA.y));
			this._juice = Math.floor(Math.max(0, this._juice - dist))
			this._constraint.pointA = {x: mouse.x, y: mouse.y};

			this._canCharge = false;
			return;
		}

		const scene = game.world().scene();
		const mouse = game.keys(this._player.clientId()).mouse();
		const ray = new BABYLON.Ray(game.lakitu().camera().position, new BABYLON.Vector3(mouse.x, mouse.y, 0).subtractInPlace(game.lakitu().camera().position));
		const raycasts = scene.multiPickWithRay(ray);

		for (let raycast of raycasts) {
			if (raycast.hit && raycast.pickedMesh.metadata && raycast.pickedMesh.metadata.entityId) {
				let [other, found] = game.entities().getEntity(raycast.pickedMesh.metadata.entityId);

				if (found && other.hasComponent(ComponentType.PROFILE) && other.hasComponent(ComponentType.ATTRIBUTES)) {
					let attributes = other.getComponent<Attributes>(ComponentType.ATTRIBUTES);
					if (attributes.getAttribute(AttributeType.PICKABLE)) {
						let profile = other.getComponent<Profile>(ComponentType.PROFILE);
						this.resetTarget();
						this._target = other;

						const mouse = game.keys(this._player.clientId()).mouse();
						[this._constraint, this._constraintId] = profile.addConstraint(MATTER.Constraint.create({
							pointA: {x: mouse.x, y: mouse.y },
							bodyB: profile.body(),
							damping: 0.1,
							stiffness: 0.5,
							length: 0,
							render: {
								visible: false,
							},
						}));
						game.world().getLayer<BABYLON.HighlightLayer>(LayerType.HIGHLIGHT).addMesh(other.getComponent<Model>(ComponentType.MODEL).mesh(), BABYLON.Color3.Red());
						MATTER.Body.setDensity(profile.body(), 0.01 * profile.body().density);
						break;
					}
				}
			}
		}

		return true;
	}

	override release(dir : Vec2) : boolean {
		this.resetTarget();
		return true;
	}

	override update(millis : number) : void {
		super.update(millis);

		if (this._canCharge) {
			this._juice = Math.min(100, this._juice + 1);
		}	
	}

	private resetTarget() : void {
		if (defined(this._target)) {
			let profile = this._target.getComponent<Profile>(ComponentType.PROFILE);
			profile.deleteConstraint(this._constraintId);
			MATTER.Body.setDensity(profile.body(), 100 * profile.body().density);

			game.world().getLayer<BABYLON.HighlightLayer>(LayerType.HIGHLIGHT).removeMesh(this._target.getComponent<Model>(ComponentType.MODEL).mesh());
			this._target = null;
		}

		if (!this._usageTimer.hasTimeLeft()) {
			this._usageTimer.start(2000, () => {
				this._canCharge = true;
			});
		}
	}
}