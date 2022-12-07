import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Keys } from 'game/component/keys'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Data } from 'game/data'
import { Entity, EntityOptions, EntityType } from 'game/entity'

import { loader, Model } from 'loader'

import { Key } from 'ui/input'

import { defined } from 'util/common'

export class Player extends Entity {
	private readonly _rotationOffset = -0.1;

	private _keys : Keys;
	private _mesh : Mesh;
	private _playerMesh : BABYLON.Mesh;
	private _profile : Profile;

	constructor(options : EntityOptions) {
		super(EntityType.PLAYER, options);

		this.attributes().set(Attribute.GROUNDED, false);
		this.attributes().set(Attribute.SOLID, true);

		this._keys = <Keys>this.add(new Keys());

		this._profile = <Profile>this.add(new Profile({
			bodyFn: (entity : Entity) => {
				const pos = entity.profile().pos();
				const dim = entity.profile().dim();
				return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					inertia: Infinity,
					friction: 0,
				})
			},
		}));
		if (defined(options.pos)) {
			this._profile.setPos(options.pos);
		}
		this._profile.setDim({x: 0.8, y: 1.44 });
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});

		this._mesh = <Mesh>this.add(new Mesh({
			readyFn: (entity : Entity) => { return entity.profile().ready(); },
			meshFn: (entity : Entity, onLoad : (mesh : BABYLON.Mesh) => void) => {
				loader.load(Model.CHICKEN, (mesh : BABYLON.Mesh) => {
					onLoad(mesh);

					const dim = entity.profile().dim();
					this._playerMesh = mesh.getChildMeshes<BABYLON.Mesh>(/*direct=*/true)[0];
					this._playerMesh.rotation.y = Math.PI / 2 + this._rotationOffset;
					this._playerMesh.position.y -= dim.y / 2;
				});
			},
		}));
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this._profile.setAcc({ y: Profile.gravity });
		if (!this.attributes().get(Attribute.GROUNDED) && this._profile.vel().y < 0) {
			this._profile.addAcc({ y: Profile.gravity });
		}

		if (this._keys.keyDown(Key.LEFT)) {
			this._profile.setAcc({ x: -2 });
		} else if (this._keys.keyDown(Key.RIGHT)) {
			this._profile.setAcc({ x: 2 });
		} else {
			this._profile.setAcc({ x: 0 });
		}

		if (this.attributes().get(Attribute.GROUNDED) && this._keys.keyDown(Key.JUMP)) {
			this._profile.setVel({ y: 0.8 });
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

		this.attributes().set(Attribute.GROUNDED, false);
	}

	override collide(entity : Entity) : void {
		super.collide(entity);

		if (entity.attributes().getOrDefault(Attribute.SOLID)) {
			this.attributes().set(Attribute.GROUNDED, true);
		}
	}
}