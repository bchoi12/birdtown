import { game } from 'game'
import { GameObject, GameObjectBase, NetworkBehavior } from 'game/core'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { LevelType } from 'game/system/level'

import { defined } from 'util/common'

export enum SystemType {
	UNKNOWN,
	CLIENT_INFO,
	CLIENT_INFOS,
	DUEL_MODE,
	ENTITIES,
	ENTITY_MAP,
	INPUT,
	KEYS,
	LAKITU,
	LEVEL,
	OFFLINE_ENTITIES,
	PHYSICS,
	RUNNER,
	WORLD,
}

export interface System extends GameObject {
	type() : SystemType;

	hasTargetEntity() : boolean;
	targetEntity() : Entity;
	setTargetEntity(entity : Entity) : void;

	onSetGameId(gameId : number) : void;
	onNewClient(name : string, clientId : number) : void;
	onLevelLoad(level : LevelType, seed : number) : void;
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

	onSetGameId(gameId : number) : void {}
	onNewClient(name : string, clientId : number) : void {}
	onLevelLoad(level : LevelType, seed : number) : void {}
}