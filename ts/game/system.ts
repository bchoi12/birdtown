import { game } from 'game'
import { GameObject, GameObjectBase } from 'game/game_object'
import { Entity, EntityOptions } from 'game/entity'
import { LevelType, SystemType } from 'game/system/api'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { NetworkBehavior } from 'network/api'

import { defined, isLocalhost } from 'util/common'

export interface System extends GameObject {
	type() : SystemType;

	hasTargetEntity() : boolean;
	targetEntity<T extends Entity>() : T;
	setTargetEntity<T extends Entity>(entity : T) : void;
	clearTargetEntity() : void;

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
	targetEntity<T extends Entity>() : T { return <T>this._targetEntity; }
	setTargetEntity<T extends Entity>(entity : T) : void {
		this._targetEntity = entity;
		this.addNameParams({
			target: entity,
		});
	}
	clearTargetEntity() : void {
		this._targetEntity = null;
		this.addNameParams({
			target: null,
		});
	}

	handleMessage(msg : GameMessage) : void {
		this.execute<System>((system : System) => {
			if (defined(system.handleMessage)) {
				system.handleMessage(msg);			
			}
		});
	}
}

export abstract class ClientSystemManager extends SystemBase implements System {

	constructor(type : SystemType) {
		super(type);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() === GameMessageType.CLIENT_JOIN) {
			const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
			if (!this.hasFactoryFn()) {
				console.error("Error: %s missing FactoryFn for new client %d", this.name(), clientId);
				return;
			}
			let child = <System>this.getFactoryFn()(clientId);
			child.handleMessage(msg);
		} else if (msg.type() === GameMessageType.CLIENT_DISCONNECT) {
			const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
			if (this.hasChild(clientId)) {
				let child = this.getChild(clientId);
				child.delete();

				if (isLocalhost()) {
					console.log("%s: deleting disconnected %s", this.name(), child.name());
				}
			}
		}
	}
}

export abstract class ClientSystem extends SystemBase implements System {
	protected _clientId : number;

	constructor(type : SystemType, clientId : number) {
		super(type);

		this._clientId = clientId;

		this.addNameParams({
			base: "client_system",
			id: this._clientId,
		});
	}

	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this._clientId === game.clientId(); }

	override networkBehavior() : NetworkBehavior {
		if (this.isHost()) {
			return NetworkBehavior.SOURCE;
		} else if (this.clientIdMatches()) {
			return NetworkBehavior.RELAY;
		}

		return NetworkBehavior.COPY;
	}
}

export abstract class ClientSideSystem extends ClientSystem implements System {
	constructor(type : SystemType, clientId : number) {
		super(type, clientId);

		this.addNameParams({
			base: "client_side_system",
			id: clientId,
		});
	}

	override networkBehavior() : NetworkBehavior {
		if (this.clientIdMatches()) {
			return NetworkBehavior.SOURCE;
		} else if (this.isHost()) {
			return NetworkBehavior.RELAY;
		}
		
		return NetworkBehavior.COPY;
	}
}