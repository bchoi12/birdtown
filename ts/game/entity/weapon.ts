import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Attribute } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Player } from 'game/entity/player'
import { loader, LoadResult, ModelType } from 'game/loader'

import { defined } from 'util/common'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export abstract class Weapon extends EntityBase {

	protected _reloadTimer : Timer;

	protected _player : Player;
	protected _shoot : BABYLON.TransformNode;

	constructor(entityType : EntityType, options : EntityOptions) {
		super(entityType, options);

		this._reloadTimer = this.newTimer();

		this.add(new Model({
			meshFn: (model : Model) => {
				loader.load(this.modelType(), (result : LoadResult) => {
					this.initializeWeaponMesh(model, result);
				});
			},
		}));
	}

	override ready() : boolean { return super.ready() && this.attributes().has(Attribute.OWNER); }

	abstract modelType() : ModelType;
	shootNode() : BABYLON.TransformNode { return defined(this._shoot) ? this._shoot : this.model().mesh(); }
	pivot() : BABYLON.Vector3 {return this.model().mesh().position; }

	abstract shoot(dir : Vec2) : boolean;
	reload(time : number) : void {
		this.attributes().set(Attribute.READY, false);
		this._reloadTimer.start(time, () => {
			this.attributes().set(Attribute.READY, true);
		});
	}

	protected initializeWeaponMesh(model : Model, result : LoadResult) : void {
		let mesh = <BABYLON.Mesh>result.meshes[0];
		mesh.name = this.name();
		model.setMesh(mesh);

		model.onLoad(() => {
			this._player = <Player>game.entities().get(<number>this.attributes().get(Attribute.OWNER));
			this._player.equipWeapon(this);
		});

		result.transformNodes.forEach((node : BABYLON.TransformNode) => {
			if (node.name === "shoot") {
				this._shoot = node;
			}
		});
	}
}
