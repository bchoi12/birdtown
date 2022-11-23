import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Keys } from 'game/component/keys'
import { Profile } from 'game/component/profile'
import { Data } from 'game/data'
import { Entity, EntityOptions, EntityType } from 'game/entity'

import { Key } from 'ui/input'

import { defined } from 'util/common'

export class Player extends Entity {

	// TODO: attribute
	private _grounded : boolean;

	constructor(options : EntityOptions) {
		super(EntityType.PLAYER, options);

		this._grounded = true;

		let keys = <Keys>this.add(new Keys());
		if (defined(options.clientId)) {
			keys.setClientId(options.clientId)
		}

		let profile = <Profile>this.add(new Profile({
			readyFn: (profile : Profile) => {
				return profile.hasPos();  
			},
			bodyFn: (profile : Profile) => {
				const pos = profile.pos();
				return MATTER.Bodies.rectangle(pos.x, pos.y, 1, 1)
			},
			meshFn: () => {
				return BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: 1,
					height: 1,
					depth: 1,
				}, game.scene());
			},
		}));
		if (defined(options.pos)) {
			profile.setPos(options.pos);
		}

	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		const keys = <Keys>this.get(ComponentType.KEYS);
		let profile = <Profile>this.get(ComponentType.PROFILE);

		if (keys.keyDown(Key.LEFT)) {
			profile.setAcc({ x: -5 });
		} else if (keys.keyDown(Key.RIGHT)) {
			profile.setAcc({ x: 5 });
		} else {
			profile.setAcc({ x: 0 });
		}

		if (this._grounded && keys.keyDown(Key.JUMP)) {
			profile.setVel({
				y: 0.8,
			});
		}
	}

	override update(millis : number) : void {
		super.update(millis);

		let profile = <Profile>this.get(ComponentType.PROFILE);

		if (profile.body().position.y < -5) {
			profile.setPos({ x: 0, y: 10 });
			profile.setVel({ x: 0, y: 0 });
		}

		if (Math.abs(profile.body().position.x) > 10) {
			profile.setPos({ x: 0, y: 10 });
			profile.setVel({ x: 0, y: 0 });
		}
	}

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		this._grounded = false;
	}

	override collide(entity : Entity) : void {
		super.collide(entity);

		if (entity.type() === EntityType.WALL) {
			this._grounded = true;
		}
	}
}