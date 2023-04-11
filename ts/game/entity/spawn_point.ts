
import { Attribute, Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { BodyFactory } from 'game/factory/body_factory'

import { Vec, Vec2 } from 'util/vector'

export class SpawnPoint extends EntityBase {

	private _attributes : Attributes;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SPAWN_POINT, entityOptions);

		this.setName({
			base: "spawn_point",
			id: this.id(),
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.dim(), {
					isStatic: true,
					isSensor: true,
				});
			},
			init: entityOptions.profileInit,
		}));
	}
}