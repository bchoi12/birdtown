import { game } from 'game'
import { GameObject, GameObjectBase } from 'game/game_object'
import { Entity, EntityOptions } from 'game/entity'
import { LevelType, SystemType } from 'game/system/api'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { NetworkBehavior } from 'network/api'

import { defined } from 'util/common'

export interface System extends GameObject {
	type() : SystemType;

	hasTargetEntity() : boolean;
	targetEntity() : Entity;
	setTargetEntity(entity : Entity) : void;

	handleMessage(msg : GameMessage) : void;
}

export abstract class SystemBase extends GameObjectBase implements System {

	protected _type : SystemType;

	protected _targetEntity : Entity;

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

	handleMessage(msg : GameMessage) : void {
		this.executeCallback<System>((system : System) => {
			if (defined(system.handleMessage)) {
				system.handleMessage(msg);			
			}
		});
	}
}

export abstract class ClientSystem extends SystemBase implements System {
	protected _clientId : number;

	constructor(type : SystemType, clientId : number) {
		super(type);

		this._clientId = clientId;

		this.setName({
			base: "client_system",
		});
	}

	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this._clientId === game.clientId(); }
}

export abstract class ClientSideSystem extends ClientSystem implements System {
	constructor(type : SystemType, clientId : number) {
		super(type, clientId);

		this.setName({
			base: "client_side_system",
		});
	}

	override networkBehavior() : NetworkBehavior {
		if (this.clientIdMatches()) {
			return NetworkBehavior.SOURCE;
		} else if (this.isHost()) {
			return NetworkBehavior.RELAY;
		} else {
			return NetworkBehavior.COPY;
		}
	}
}