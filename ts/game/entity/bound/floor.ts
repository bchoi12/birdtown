
import { HexColors } from 'game/component/hex_colors'
import { Profile } from 'game/component/profile'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Bound } from 'game/entity/bound'
import { ColorType } from 'game/factory/api'

export class Floor extends Bound {

	private _hexColors : HexColors;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.FLOOR, entityOptions);

		this._hexColors = this.addComponent<HexColors>(new HexColors(entityOptions.hexColorsInit));

		if (this._hexColors.hasMainColor()) {
			this._profile.onBody((profile : Profile) => {
				profile.body().render.fillStyle = this._hexColors.mainColor().toString();
				profile.body().render.strokeStyle = this._hexColors.mainColor().toString();
			});
			this._profile.setRenderUnoccluded();
		}
	}
}