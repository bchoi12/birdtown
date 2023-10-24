
import { AttributeType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

import { Vec, Vec2 } from 'util/vector'

export class SpawnPoint extends EntityBase implements Entity {

	private _association : Association;
	private _attributes : Attributes;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SPAWN_POINT, entityOptions);

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.dim(), {
					isStatic: true,
					isSensor: true,
					render: {
						visible: false,
					},
				});
			},
			init: entityOptions.profileInit,
		}));
	}
}