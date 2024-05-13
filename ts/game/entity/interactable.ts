
import { EntityType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions, InteractEntity } from 'game/entity'

export abstract class Interactable extends EntityBase implements InteractEntity {

	private _canInteractIds : Map<number, boolean>;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.INTERACTABLE);

		this._canInteractIds = new Map();
	}

	clearInteractable() : void {
		this._canInteractIds.clear();
	}

	setInteractableWith(entity : Entity, interactable : boolean) : void {
		this._canInteractIds.set(entity.id(), interactable);
	}
	canInteractWith(entity : Entity) : boolean {
		return this._canInteractIds.has(entity.id()) && this._canInteractIds.get(entity.id());
	}
	abstract interactWith(entity : Entity) : void;
}