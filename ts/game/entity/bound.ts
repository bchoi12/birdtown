
import { ComponentType, AttributeType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Profile, MinimapOptions } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { CollisionCategory, DepthType, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'

export abstract class BoundBase extends EntityBase implements Entity {

	protected _attributes : Attributes;
	protected _profile : Profile;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BOUND);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					isStatic: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.BOUND),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setVisible(false);
	}

	override impactSound() : SoundType { return SoundType.THUD; }
}

export class Bound extends BoundBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOUND, entityOptions);
	}
}