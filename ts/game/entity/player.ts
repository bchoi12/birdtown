import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/attributes'
import { Keys } from 'game/component/keys'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Data } from 'game/data'
import { Entity, EntityOptions, EntityType } from 'game/entity'

import { Key } from 'ui/input'

import { defined } from 'util/common'

export class Player extends Entity {

	private _attributes : Attributes;
	private _keys : Keys;
	private _mesh : Mesh;
	private _profile : Profile;

	constructor(options : EntityOptions) {
		super(EntityType.PLAYER, options);

		this._attributes = <Attributes>this.add(new Attributes());
		this._attributes.set(Attribute.GROUNDED, false);

		this._keys = <Keys>this.add(new Keys());

		this._profile = <Profile>this.add(new Profile({
			readyFn: (entity : Entity) => {
				return entity.has(ComponentType.PROFILE) && entity.profile().hasPos();  
			},
			bodyFn: (entity : Entity) => {
				const pos = entity.profile().pos();
				return MATTER.Bodies.rectangle(pos.x, pos.y, 1, 1)
			},
		}));
		this._profile.setPos(defined(options.pos) ? options.pos : {x: 0, y: 0});
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});

		this._mesh = <Mesh>this.add(new Mesh({
			readyFn: (entity : Entity) => {
				return entity.has(ComponentType.PROFILE) && entity.profile().hasPos();  
			},
			meshFn: () => {
				return BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: 1,
					height: 1,
					depth: 1,
				}, game.scene());
			},
		}));
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this._profile.setAcc({ y: Profile.gravity });
		if (!this._attributes.get(Attribute.GROUNDED) && this._profile.vel().y < 0) {
			this._profile.addAcc({ y: Profile.gravity });
		}

		if (this._keys.keyDown(Key.LEFT)) {
			this._profile.setAcc({ x: -5 });
		} else if (this._keys.keyDown(Key.RIGHT)) {
			this._profile.setAcc({ x: 5 });
		} else {
			this._profile.setAcc({ x: 0 });
		}

		if (this._attributes.get(Attribute.GROUNDED) && this._keys.keyDown(Key.JUMP)) {
			this._profile.setVel({
				y: 0.8,
			});
		}
	}

	override update(millis : number) : void {
		super.update(millis);

		if (this._profile.body().position.y < -5) {
			this._profile.setPos({ x: 0, y: 10 });
			this._profile.setVel({ x: 0, y: 0 });
		}

		if (Math.abs(this._profile.body().position.x) > 10) {
			this._profile.setPos({ x: 0, y: 10 });
			this._profile.setVel({ x: 0, y: 0 });
		}
	}

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		this._attributes.set(Attribute.GROUNDED, false);
	}

	override collide(entity : Entity) : void {
		super.collide(entity);

		if (entity.type() === EntityType.WALL) {
			this._attributes.set(Attribute.GROUNDED, true);
		}
	}
}