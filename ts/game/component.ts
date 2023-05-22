import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Entity } from 'game/entity'
import { GameData, DataFilter } from 'game/game_data'
import { GameObject, GameObjectBase, NetworkBehavior} from 'game/game_object'

import { defined } from 'util/common'

export interface Component extends GameObject {
	type() : ComponentType;
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

	override ready() : boolean { return defined(this._entity); }

	type() : ComponentType { return this._type; }
	entity() : Entity { return this._entity; }
	setEntity(entity : Entity) : void {
		this.setName({
			parent: entity,
			base: this.name(),
		});
		this._entity = entity;
	}
}