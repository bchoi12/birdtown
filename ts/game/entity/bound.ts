
import { ComponentType, AttributeType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { CollisionCategory } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { DepthType } from 'game/system/api'

export abstract class Bound extends EntityBase implements Entity {

	protected _attributes : Attributes;
	protected _profile : Profile;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BOUND);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isStatic: true,
					chamfer: {
						radius: 0.03,
					},
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.BOUND),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setRenderNever();
	}

	protected setMinimapRender(color : string, depthType : DepthType) : void {
		this._profile.onBody((profile : Profile) => {
			profile.body().render.fillStyle = color;
			profile.body().render.strokeStyle = color;
			profile.body().plugin.zIndex = depthType;
		});
		this._profile.setRenderUnoccluded();
	}
}