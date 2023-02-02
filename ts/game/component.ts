import { game } from 'game'
import { GameObject, GameObjectBase } from 'game/core'
import { Entity } from 'game/entity'

import { Data, DataFilter, DataMap } from 'network/data'

import { defined } from 'util/common'

export enum ComponentType {
	UNKNOWN,
	ATTRIBUTES,
	HEALTH,
	HEX_COLORS,
	MODEL,
	OPENINGS,
	PROFILE,
}

export interface Component extends GameObject {
	type() : ComponentType;
	hasEntity() : boolean;
	entity() : Entity;
	setEntity(entity : Entity) : void;
}

export abstract class ComponentBase extends GameObjectBase implements Component {
	protected _entity : Entity;
	protected _type : ComponentType;

	constructor(type : ComponentType) {
		super("component-" + type);

		this._entity = null;
		this._type = type;
	}

	type() : ComponentType { return this._type; }
	hasEntity() : boolean { return defined(this._entity); }
	entity() : Entity { return this._entity; }
	setEntity(entity : Entity) : void {
		this.setName({
			parent: entity,
			base: this.name(),
		});
		this._entity = entity;
	}

	override shouldBroadcast() : boolean { return game.options().host; }
	override isSource() : boolean { return game.options().host; }
}