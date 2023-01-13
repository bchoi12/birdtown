import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Player } from 'game/entity/player'
import { loader, LoadResult, ModelType } from 'game/loader'

import { defined } from 'util/common'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export abstract class Weapon extends EntityBase {

	protected _attributes : Attributes;
	protected _model : Model;
	protected _reloadTimer : Timer;

	protected _owner : number;
	protected _shoot : BABYLON.TransformNode;

	protected _player : Player;

	constructor(entityType : EntityType, options : EntityOptions) {
		super(entityType, options);

		this._attributes = this.getComponent<Attributes>(ComponentType.ATTRIBUTES);

		this._model = <Model>this.addComponent(new Model({
			meshFn: (model : Model) => {
				loader.load(this.modelType(), (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.name = this.name();
					model.setMesh(mesh);

					result.transformNodes.forEach((node : BABYLON.TransformNode) => {
						if (node.name === "shoot") {
							this._shoot = node;
						}
					});
				});
			},
		}));

		this._reloadTimer = this.newTimer();
	}

	override ready() : boolean { return super.ready() && this._attributes.has(Attribute.OWNER); }

	override initialize() : void {
		super.initialize();

		this._owner = <number>this._attributes.get(Attribute.OWNER);
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (!this._model.hasMesh()) {
			return;
		}

		if (!defined(this._player)) {
			if (game.entities().hasEntity(this._owner)) {
				this._player = <Player>game.entities().getEntity(this._owner);
				this._player.equipWeapon(this);
			}
		}
	}

	abstract modelType() : ModelType;
	shootNode() : BABYLON.TransformNode { return defined(this._shoot) ? this._shoot : this._model.mesh(); }
	pivot() : BABYLON.Vector3 {return this._model.mesh().position; }

	abstract shoot(dir : Vec2) : boolean;
	reload(time : number) : void {
		this._attributes.set(Attribute.READY, false);
		this._reloadTimer.start(time, () => {
			this._attributes.set(Attribute.READY, true);
		});
	}
}
