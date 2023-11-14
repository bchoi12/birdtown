
import { game } from 'game'
import { ComponentType, AttributeType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

import { defined } from 'util/common'
import { Vec } from 'util/vector'

export class Wall extends EntityBase implements Entity {

	private _attributes : Attributes;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WALL, entityOptions);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isStatic: true,
					collisionFilter: {
						group: BodyFactory.ignoreWallGroup,
					},
					render: {
						lineWidth: 0,
					}
				});
			},
			init: entityOptions.profileInit,
		}));
	}
}