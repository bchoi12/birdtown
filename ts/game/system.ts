import { game } from 'game'
import { GameObject, GameObjectBase } from 'game/core'
import { Entity } from 'game/entity'

import { Data, DataFilter, DataMap } from 'network/data'

import { defined } from 'util/common'

export enum SystemType {
	UNKNOWN,
	ENTITY_MAP,
	INPUT,
	KEYS,
	LAKITU,
}

export interface System extends GameObject {
	type() : SystemType;

	hasEntity() : boolean;
	entity() : Entity;
	setEntity(entity : Entity) : void;
}

// TODO: add seqNum
export abstract class SystemBase extends GameObjectBase implements System {
	protected _entity : Entity;
	protected _type : SystemType;

	constructor(type : SystemType) {
		super("system-" + type);

		this._entity = null;
		this._type = type;

	}

	override ready() : boolean { return true; }

	type() : SystemType { return this._type; }
	hasEntity() : boolean { return defined(this._entity); }
	entity() : Entity { return this._entity; }
	setEntity(entity : Entity) : void { this._entity = entity; }

	override shouldBroadcast() : boolean { return game.options().host; }
	override isSource() : boolean { return game.options().host; }
}