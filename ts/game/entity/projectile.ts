
import { AssociationType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'

export abstract class Projectile extends EntityBase {

	protected _association : Association;
	protected _attributes : Attributes;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.PROJECTILE);

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
	}

	override ready() : boolean {
		return super.ready() && this._association.hasAssociation(AssociationType.OWNER);
	}

	explode() : void {
		if (!this.hasProfile()) {
			return;
		}

		const profile = this.profile();
		if (profile.initialized()) {
			let [explosion, hasExplosion] = this.addEntity(EntityType.EXPLOSION, {
				profileInit: {
					pos: profile.pos(),
					dim: {x: 3, y: 3},
				},
			});
			if (hasExplosion) {
				explosion.setTTL(200);
			}
		}
	}

	abstract damage() : number;
}