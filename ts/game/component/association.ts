
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { AssociationType, ComponentType } from 'game/component/api'
import { Entity } from 'game/entity'

import { defined } from 'util/common'
import { Optional } from 'util/optional'

export type AssociationInitOptions = {
	// Query map first before checking owner
	team? : number;
	owner? : Entity;
}

export class Association extends ComponentBase implements Component {

	private _associations : Map<AssociationType, number>;
	private _owner : Optional<Entity>;

	constructor(init? : AssociationInitOptions) {
		super(ComponentType.ASSOCIATION);

		if (!defined(init)) { init = {}; }

		this._associations = new Map();
		if (init.team) {
			this._associations.set(AssociationType.TEAM, init.team);
		}

		this._owner = new Optional();
		if (init.owner) {
			this._owner.set(init.owner);
		}

		if (!this.hasAssociation(AssociationType.OWNER)) {
			if (this._owner.has()) {
				this._associations.set(AssociationType.OWNER, this._owner.get().id());
			}
		}

		for (const stringAssociation in AssociationType) {
			const type = Number(AssociationType[stringAssociation]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			this.registerProp<number>(type, {
				has: () => { return this.hasAssociation(type); },
				export: () => { return this.getAssociation(type); },
				import: (obj : number) => { this.setAssociation(type, obj); },
			})
		}
	}

	getTeam() : number { return this._associations.has(AssociationType.TEAM) ? this._associations.get(AssociationType.TEAM) : 0; }
	toMap() : Map<AssociationType, number> {
		let associations = new Map<AssociationType, number>();

		if (this._owner.has() && this._owner.get().hasComponent(ComponentType.ASSOCIATION)) {
			const ownerAssociations = this._owner.get().getComponent<Association>(ComponentType.ASSOCIATION);
			ownerAssociations.toMap().forEach((value : number, type : AssociationType) => {
				associations.set(type, value);
			});
		}

		this._associations.forEach((value : number, type : AssociationType) => {
			if (!associations.has(type)) {
				associations.set(type, value);
			}
		});

		return associations;
	}

	hasAssociation(type : AssociationType) : boolean {
		if (this._associations.has(type)) {
			return true;
		}

		if (this._owner.has() && this._owner.get().hasComponent(ComponentType.ASSOCIATION)) {
			const ownerAssociations = this._owner.get().getComponent<Association>(ComponentType.ASSOCIATION);
			if (ownerAssociations.hasAssociation(type)) {
				return true;
			}
		}

		return false;
	}
	getAssociationOr(type : AssociationType, value : number) : number {
		if (!this.hasAssociation(type)) { return value; }

		return this.getAssociation(type);
	}
	getAssociation(type : AssociationType) : number {
		if (this._associations.has(type)) { return this._associations.get(type); }

		if (this._owner.has()) {
			const ownerAssociations = this._owner.get().getAssociations();

			if (ownerAssociations.has(type)) {
				return ownerAssociations.get(type); 
			}
		}
		console.error("Warning: retrieving unset association %d, defaulting to 0", type);
		return 0;
	}
	setAssociation(type : AssociationType, value : number) : void {
		this._associations.set(type, value);
	}
}