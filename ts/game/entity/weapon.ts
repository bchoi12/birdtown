import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Player } from 'game/entity/player'
import { loader, LoadResult, MeshType } from 'game/loader'

import { defined } from 'util/common'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export abstract class Weapon extends EntityBase {
	private static readonly _shootNodeName = "shoot";

	protected _attributes : Attributes;
	protected _model : Model;
	protected _reloadTimer : Timer;

	protected _owner : number;
	protected _shoot : BABYLON.TransformNode;

	protected _player : Player;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this._allTypes.add(EntityType.WEAPON);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				loader.load(this.meshType(), (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];

					result.transformNodes.forEach((node : BABYLON.TransformNode) => {
						if (node.name === Weapon._shootNodeName) {
							this._shoot = node;
						}
					});

					model.setMesh(mesh);
				});
			},
		}));

		this._reloadTimer = this.newTimer();
	}

	override ready() : boolean { return super.ready() && this._attributes.getAttribute(Attribute.OWNER) > 0; }

	override initialize() : void {
		super.initialize();

		this._owner = <number>this._attributes.getAttribute(Attribute.OWNER);
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (!this._model.hasMesh()) {
			return;
		}

		if (!defined(this._player)) {
			if (game.entities().hasEntity(this._owner)) {
				this._player = game.entities().getEntity<Player>(this._owner);
				this._player.equipWeapon(this);
			}
		}
	}

	abstract meshType() : MeshType;
	shootNode() : BABYLON.TransformNode { return defined(this._shoot) ? this._shoot : this._model.mesh(); }

	abstract shoot(dir : Vec2) : boolean;
	reload(time : number) : void {
		this._attributes.set(Attribute.READY, false);
		this._reloadTimer.start(time, () => {
			this._attributes.set(Attribute.READY, true);
		});
	}
}
