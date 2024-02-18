import { game } from 'game'
import { GameObject, GameObjectBase } from 'game/game_object'
import { Entity, EntityOptions } from 'game/entity'
import { LevelType, SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { NetworkBehavior } from 'network/api'

import { KeyType, KeyState } from 'ui/api'

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
		super(SystemType[type].toLowerCase());

		this._targetEntity = null;
		this._type = type;
	}

	type() : SystemType { return this._type; }

	addSubSystem<T extends System>(id : number, system : T) : T {
		return this.registerChild(id, this.populateSubSystem<T>(system));
	}
	hasSubSystem(type : SystemType) : boolean { return this.hasChild(type); }
	subSystem<T extends System>(type : SystemType) : T { return this.getChild<T>(type); }

	hasTargetEntity() : boolean { return this._targetEntity !== null && this._targetEntity.initialized() && !this._targetEntity.deleted(); }
	targetEntity<T extends Entity>() : T { return <T>this._targetEntity; }
	setTargetEntity<T extends Entity>(entity : T) : void {
		this._targetEntity = entity;
		this.addNameParams({
			target: entity,
		});

		this.execute<System>((subSystem : System) => {
			subSystem.setTargetEntity(entity);
		});
	}
	clearTargetEntity() : void {
		this._targetEntity = null;
		this.addNameParams({
			target: null,
		});

		this.execute<System>((subSystem : System) => {
			subSystem.clearTargetEntity();
		});
	}

	handleMessage(msg : GameMessage) : void {
		this.execute<System>((system : System) => {
			if (system.handleMessage) {
				system.handleMessage(msg);			
			}
		});
	}

	private populateSubSystem<T extends System>(system : T) : T {
		if (this.hasTargetEntity()) {
			this.execute<System>((subSystem : System) => {
				subSystem.setTargetEntity(this.targetEntity());
			});
		}
		return system;
	}
}

export abstract class ClientSystemManager extends SystemBase implements System {

	constructor(type : SystemType) {
		super(type);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() === GameMessageType.CLIENT_JOIN) {
			const clientId = msg.getClientId();
			if (!this.hasFactoryFn()) {
				console.error("Error: %s missing FactoryFn for new client %d", this.name(), clientId);
				return;
			}
			let child = <System>this.getFactoryFn()(clientId);
			child.handleMessage(msg);
		} else if (msg.type() === GameMessageType.CLIENT_DISCONNECT) {
			const clientId = msg.getClientId();
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
			id: this._clientId,
		});
	}

	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this._clientId === game.clientId(); }

	anyKey(types : KeyType[], state : KeyState) : boolean {
		return types.some((type : KeyType) => this.key(type, state));
	}
	key(type : KeyType, state : KeyState) : boolean {
		if (!game.input().hasKeys(this.clientId())) {
			return false;
		}
		const keys = game.keys(this.clientId());
		return keys.getKey(type).keyState() === state;
	}

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