import { game } from 'game'
import { GameObject, GameObjectBase, NetworkBehavior } from 'game/game_object'
import { Entity, EntityOptions } from 'game/entity'
import { LevelType, SystemType, LevelLoadMsg, NewClientMsg } from 'game/system/api'

import { defined } from 'util/common'

export interface System extends GameObject {
	type() : SystemType;

	hasTargetEntity() : boolean;
	targetEntity() : Entity;
	setTargetEntity(entity : Entity) : void;

	onSetGameId(gameId : number) : void;
	onNewClient(msg : NewClientMsg) : void;
	onLevelLoad(msg : LevelLoadMsg) : void;
}

export abstract class SystemBase extends GameObjectBase implements System {
	protected _targetEntity : Entity;
	protected _type : SystemType;

	constructor(type : SystemType) {
		super("system-" + type);

		this._targetEntity = null;
		this._type = type;
	}

	type() : SystemType { return this._type; }
	hasTargetEntity() : boolean { return defined(this._targetEntity); }
	targetEntity() : Entity { return this._targetEntity; }
	setTargetEntity(entity : Entity) : void {
		this._targetEntity = entity;
		this.setName({
			base: this.name(),
			target: entity,
		});
	}

	onSetGameId(gameId : number) : void {
		this.executeCallback<System>((system : System) => {
			if (defined(system.onSetGameId)) {
				system.onSetGameId(gameId);
			}
		});
	}
	onNewClient(msg : NewClientMsg) : void {
		this.executeCallback<System>((system : System) => {
			if (defined(system.onNewClient)) {
				system.onNewClient(msg);
			}
		});
	}
	onLevelLoad(msg : LevelLoadMsg) : void {
		this.executeCallback<System>((system : System) => {
			if (defined(system.onLevelLoad)) {
				system.onLevelLoad(msg);
			}
		});
	}
}

export abstract class ClientSystem extends SystemBase implements System {
	protected _gameId : number;

	constructor(type : SystemType, gameId : number) {
		super(type);

		this._gameId = gameId;

		this.setName({
			base: "client_system",
		});
	}

	gameId() : number { return this._gameId; }

	override networkBehavior() : NetworkBehavior {
		if (game.id() === this.gameId()) {
			return NetworkBehavior.SOURCE;
		} else if (this.isHost()) {
			return NetworkBehavior.RELAY;
		} else {
			return NetworkBehavior.COPY;
		}
	}
}